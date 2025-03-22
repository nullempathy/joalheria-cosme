import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import express from "express";
import path from "path";
import cors from "cors";
import nodemailer from "nodemailer";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { fileURLToPath } from "url";
import { dirname } from "path";

// Definir __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || "secret";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); 
app.use(express.static(path.join(__dirname, "BeautySalon")));
app.use(cookieParser()); 

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

// Rota para envio de e-mail
app.post("/send-email", async (req, res) => {
  const { nome, email, assunto, mensagem } = req.body;

  if (!nome || !email || !assunto || !mensagem) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "messiassilvadev@gmail.com", // Email que receberá as mensagens
      subject: `Nova mensagem de contato: ${assunto}`, // Assunto do Email
      text: `Nome: ${nome}\nE-mail: ${email}\n\nMensagem:\n${mensagem}`, // Mensagem
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: "E-mail enviado com sucesso!" });
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    res.status(500).json({ error: "Erro ao enviar e-mail" });
  }
});










// Conectar ao banco de dados SQLite
const db = new sqlite3.Database("database.sqlite", (err) => {
  if (err) console.error("Erro ao conectar ao banco de dados", err);
  else console.log("Conectado ao SQLite");
});

// Criar tabela de usuários
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  // Criar usuário admin se não existir
  db.get("SELECT * FROM users WHERE username = ?", ["admin"], async (err, row) => {
    if (!row) {
      const hashedPassword = await bcrypt.hash("456", 10);
      db.run("INSERT INTO users (username, password) VALUES (?, ?)", ["admin", hashedPassword]);
      console.log("Usuário admin criado.");
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS jewelry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    image TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error("Erro ao criar tabela jewelry:", err);
    } else {
      console.log("Tabela jewelry verificada/criada com sucesso.");
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    photo TEXT DEFAULT 'nothing'
  )`, (err) => {
    if (err) {
      console.error("Erro ao criar tabela clients:", err);
    } else {
      console.log("Tabela clients verificada/criada com sucesso.");
    }
  });


});









// Middleware para autenticação em páginas HTML
const autenticarPagina = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.redirect("/pages/login.html"); // Redireciona para login se não houver token
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.redirect("/pages/login.html"); // Redireciona para login se token for inválido
    }
    req.user = user;
    next();
  });
};


// Middleware de autenticação de upload
const autenticarToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Token de autenticação ausente." });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(401).json({ error: "Token inválido." });
    }
    req.user = user; // Adiciona informações do usuário no request
    next(); // Continua para a rota
  });
};


// Middleware para servir páginas protegidas
app.get("/pages/upload.html", autenticarPagina, (req, res) => {
  res.sendFile(path.join(__dirname, "BeautySalon/pages/upload.html"));
});



// Servir a página inicial (Home)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "BeautySalon/index.html"));
});

// Servir a página de login
app.get("/pages/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "BeautySalon/pages/login.html"));
});




// Limite de tentativas de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limita a 5 tentativas por IP
  message: "Muitas tentativas de login. Tente novamente mais tarde.",
});




// Rota de login
app.post("/login", loginLimiter, (req, res) => {
  const { usuario, senha } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [usuario], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    const senhaCorreta = await bcrypt.compare(senha, user.password);
    if (!senhaCorreta) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });

    // Define o token como um cookie para que o navegador o envie automaticamente
    res.cookie("token", token, { httpOnly: true, maxAge: 3600000 });

    // Redireciona para a página protegida
    res.json({ success: true, token, redirect: "/pages/upload.html" });

  });
});




// Configuração do multer para armazenar arquivos temporariamente
const upload = multer({
  dest: "temp/",
  limits: {
    fileSize: 15 * 1024 * 1024 // Limite de tamanho do arquivo (15MB)
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/; // Tipos de arquivo permitidos
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase()); // Verifica a extensão
    const mimetype = filetypes.test(file.mimetype); // Verifica o tipo MIME

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error("Arquivo deve ser PNG ou JPG"));
    }
  }
 });

 
app.post("/cadastrar-joia", autenticarToken, upload.fields([
  { name: "imagem-da-joia", maxCount: 1 },
  { name: "foto-cliente", maxCount: 1 }
]), async (req, res) => {
  try {

    // Verificar se a imagem foi enviada
    if (!req.files["imagem-da-joia"]) {
      return res.status(400).json({ error: "Imagem obrigatória." });
    }

    const imagemDaJoia = req.files["imagem-da-joia"][0];
    const fotoCliente = req.files["foto-cliente"] ? req.files["foto-cliente"][0] : null;

    // Verificar se o tamanho do arquivo excede o limite, caso o multer não trabalhe.
    if (imagemDaJoia.size > 15 * 1024 * 1024) {
      return res.status(400).json({ error: "O tamanho da imagem não pode exceder 15MB." });
    }

    // Criar a pasta "jewelry" caso não exista
    const pastaDestino = path.join(__dirname, "BeautySalon", "assets", "jewelry");
    if (!fs.existsSync(pastaDestino)) {
      fs.mkdirSync(pastaDestino, { recursive: true });
    }

    // Definir o nome da imagem com base no timestamp para evitar duplicidade
    const ext = path.extname(imagemDaJoia.originalname); // Obter a extensão original da imagem
    const nomeArquivo = `${Date.now()}-${imagemDaJoia.originalname}`;
    const caminhoImagem = path.join(pastaDestino, nomeArquivo);

    // Mover a imagem para a pasta de destino
    fs.renameSync(imagemDaJoia.path, caminhoImagem);

    // Caso a foto do cliente seja enviada, salvar também
    let nomeFotoCliente = "nothing";
    let caminhoFotoCliente = null;
    if (fotoCliente) {
      const nomeArquivoFoto = `${Date.now()}-${fotoCliente.originalname}`;
      nomeFotoCliente = nomeArquivoFoto;
      caminhoFotoCliente = path.join(pastaDestino, nomeFotoCliente);
      fs.renameSync(fotoCliente.path, caminhoFotoCliente);
    }

    // Receber os dados do formulário
    const { nome, descricao, preco, nome_contato, email, telefone } = req.body;
    const descricaoLimitada = descricao.slice(0, 251); // Garante 251 caracteres no backend
    console.log("Dados do formulário:", req.body);
    console.log("Arquivo recebido:", req.file);

    // Salvar os dados da joia no banco, incluindo o nome da imagem
    db.run(
      "INSERT INTO jewelry (name, description, price, image) VALUES (?, ?, ?, ?)",
      [nome, descricaoLimitada, preco, nomeArquivo],
      (err) => {
        if (err) {
          return res.status(500).json({ error: "Erro ao salvar no banco." });
        }
        // Botar uma div nessa pagina de upload pra mostrar que o upload foi feito.
        res.json({ success: true, redirectUrl: "/pages/upload.html" });
      }
    );

    // Salvar os dados do cliente no banco
    db.run(
      "INSERT INTO clients (name, email, phone, photo) VALUES (?, ?, ?, ?)",
      [nome_contato, email, telefone, nomeFotoCliente],
      (err) => {
        if (err) {
          return res.status(500).json({ error: "Erro ao salvar cliente no banco." });
        }
        console.log("Cliente salvo com sucesso.");
      }
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro no servidor." });
  }
});


app.get("/api/jewelry", (req, res) => {
  db.all("SELECT name, description, price, image FROM jewelry", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});




app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));


