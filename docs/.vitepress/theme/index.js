import DefaultTheme from "vitepress/theme";
import mermaid from "mermaid";
import "./style.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (typeof window === "undefined") {
      return;
    }
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "neutral"
    });
    const renderMermaid = async () => {
      const hosts = document.querySelectorAll(".language-mermaid");
      for (const host of hosts) {
        if (host.dataset.mermaidRendered === "true") {
          continue;
        }
        const block = host.querySelector("pre code");
        if (!block) {
          continue;
        }
        const source = block.textContent || "";
        if (!source.trim()) {
          continue;
        }
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        try {
          const { svg } = await mermaid.render(id, source);
          const wrapper = document.createElement("div");
          wrapper.className = "mermaid-render";
          wrapper.innerHTML = svg;
          const existing = host.querySelector(".mermaid-render");
          if (existing) {
            existing.remove();
          }
          host.appendChild(wrapper);
          host.dataset.mermaidRendered = "true";
        } catch (error) {
          console.error("Failed to render mermaid diagram", error);
        }
      }
    };
    router.onAfterRouteChanged = () => {
      requestAnimationFrame(() => {
        renderMermaid();
      });
    };
    requestAnimationFrame(() => {
      renderMermaid();
    });
  }
};
