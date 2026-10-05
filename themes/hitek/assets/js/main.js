(function () {
  "use strict";

  // Alterna claro/escuro e guarda a escolha (mesma chave "theme" do tema anterior).
  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var root = document.documentElement;
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // Botão "copiar" nos blocos de código.
  if (navigator.clipboard) {
    document.querySelectorAll(".code").forEach(function (block) {
      var btn = block.querySelector(".code__copy");
      var code = block.querySelector("pre code");
      if (!btn || !code) return;
      var label = btn.textContent;
      btn.hidden = false;
      btn.addEventListener("click", function () {
        navigator.clipboard.writeText(code.innerText.replace(/\n$/, "")).then(function () {
          btn.textContent = btn.getAttribute("data-copied");
          setTimeout(function () { btn.textContent = label; }, 1600);
        });
      });
    });
  }
})();
