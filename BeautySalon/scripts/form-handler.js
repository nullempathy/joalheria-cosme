document.addEventListener("DOMContentLoaded", () => {
  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");

  const nextStepButton = document.getElementById("next-step");
  const prevStepButton = document.getElementById("prev-step");
  const submitFormButton = document.getElementById("submit-form");

  nextStepButton.addEventListener("click", () => {
      // Valida os campos da joia antes de avançar
      const nome = document.getElementById("nome").value.trim();
      const descricao = document.getElementById("descricao").value.trim();
      const preco = document.getElementById("preco").value.trim();
      const imagem = document.getElementById("imagem").files.length;

      if (!nome || !descricao || !preco || !imagem) {
          alert("Preencha todos os campos antes de avançar!");
          return;
      }

      step1.style.display = "none";
      step2.style.display = "block";
  });

  prevStepButton.addEventListener("click", () => {
      step2.style.display = "none";
      step1.style.display = "block";
  });

  submitFormButton.addEventListener("click", async (event) => {
      event.preventDefault();

      // Pega os dados da joia
      const formData = new FormData();
      formData.append("nome", document.getElementById("nome").value);
      formData.append("descricao", document.getElementById("descricao").value);
      formData.append("preco", document.getElementById("preco").value);
      formData.append("imagem_da_joia", document.getElementById("imagem").files[0]);

      // Pega os dados de contato
      formData.append("nome_contato", document.getElementById("nome-contato").value);
      formData.append("email", document.getElementById("email").value);
      formData.append("telefone", document.getElementById("telefone").value);

      // Verifica se o cliente enviou uma foto antes de adicionar ao FormData
      const fotoCliente = document.getElementById("foto-cliente").files;
      if (fotoCliente.length > 0) {
        formData.append("foto-cliente", fotoCliente[0]);
      }

      console.log("formData", formData);

      try {
          const response = await fetch("/cadastrar-joia", {
              method: "POST",
              credentials: "include",
              body: formData
          });

          const data = await response.json();

          console.log("");
          console.log("");
          console.log("data", data);

          if (data.success) {
              alert("Cadastro realizado com sucesso!");
              window.location.href = data.redirectUrl;
          } else {
              alert("Erro: " + data.error);
          }
      } catch (error) {
          console.error("Erro ao enviar dados:", error);
          alert("Erro inesperado. Tente novamente.");
      }
  });
});
