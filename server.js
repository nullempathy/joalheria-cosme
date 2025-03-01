require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors()); 

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

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

const path = require("path");

app.use(express.static(path.join(__dirname, "BeautySalon"))); // Serve arquivos estáticos da pasta OriginSix-main

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));


