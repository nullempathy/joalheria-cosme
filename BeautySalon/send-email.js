const form = document.getElementById("contato");

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // Previne o comportamento padrão de envio do formulário (reload da página)

  // Captura os dados do formulário
  const formData = new FormData(form);

  // Cria um objeto com os dados do formulário
  const data = {
    nome: formData.get("nome"),
    email: formData.get("email"),
    assunto: formData.get("assunto"),
    mensagem: formData.get("mensagem"),
  };

  try {
    // Envia os dados para a rota /send-email
    const response = await fetch("http://localhost:3000/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // O servidor espera um JSON
      },
      body: JSON.stringify(data), // Converte os dados para JSON
    });

    const result = await response.json(); // Espera a resposta do servidor
    if (response.ok) {
      alert(result.success); // Exibe a mensagem de sucesso
      form.reset(); // Limpa o formulário após o envio
    } else {
      alert(result.error); // Exibe a mensagem de erro
    }
  } catch (error) {
    console.error("Erro ao enviar o formulário:", error);
    alert("Ocorreu um erro ao enviar a mensagem. Tente novamente.");
  }
});
