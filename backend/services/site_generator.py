import os
import json
import zipfile
import io
from openai import OpenAI
from config import OPENAI_API_KEY, SITES_DIR

class SiteGeneratorService:
    def __init__(self):
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

    def generate_website(self, prompt, site_name):
        """Generates dynamic React + Tailwind files and writes Babel preview to disk."""
        site_name = "".join([c if c.isalnum() or c == "_" else "" for c in site_name.lower().replace(" ", "_")])
        if not site_name:
            site_name = "default_site"
            
        target_dir = os.path.join(SITES_DIR, site_name)
        os.makedirs(target_dir, exist_ok=True)
        
        print(f"[Site Generator] Generating React+Tailwind website for prompt: '{prompt}' inside: {target_dir}")
        
        # Fallback offline generator outputs
        app_jsx = self._get_offline_react_app(prompt)
        suggestions = [
            "Add animated gradient mesh to the Hero background.",
            "Use Inter font and subtle letter-spacing for headings.",
            "Implement a dark/light glassmorphic card interface for services."
        ]
        seo_meta = {
            "title": "Modern App Showcase",
            "description": f"Generated page for {prompt}",
            "keywords": "AI, React, Tailwind, web app"
        }
        
        if self.openai_client:
            try:
                system_prompt = """You are a world-class front-end software architect. 
Generate a complete, modern, fully functional, responsive, and visually stunning single-page React component styled with Tailwind CSS.
You must return a JSON object with exactly three keys:
1. 'App.jsx': The full React functional component code. It MUST be a single file starting with 'const App = () => {' and ending with 'export default App;'. It should use Tailwind CSS utility classes for styling. It should contain standard interactive features like states (e.g. mobile menu open/close, dark/light theme switching, contact form submissions, card expansions). It should have inline custom SVG icons (do not import from lucide-react or font-awesome directly, use standard inline `<svg>` markup to ensure zero dependency rendering).
2. 'suggestions': A JSON array of 3 distinct, actionable CSS/design refinement suggestions for this site.
3. 'seo': A JSON object containing 'title' (SEO title), 'description' (SEO description), and 'keywords' (comma separated keywords).

Keep styling extremely polished, startup-quality, with premium color palettes, smooth hover states, responsive flex/grid spacing, and beautiful sections (Navbar, Hero with call-to-actions, features grid, pricing/services, contact form with visual feedback state, and footer).

Do not include any explanation. Return ONLY the JSON object.
"""
                user_content = f"Create a gorgeous single-page React component utilizing Tailwind CSS for: {prompt}"
                
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    response_format={"type": "json_object"}
                )
                
                res_content = response.choices[0].message.content
                parsed = json.loads(res_content)
                
                if "App.jsx" in parsed:
                    app_jsx = parsed["App.jsx"]
                    suggestions = parsed.get("suggestions", suggestions)
                    seo_meta = parsed.get("seo", seo_meta)
                    
            except Exception as e:
                print(f"[Site Generator] OpenAI generation failed: {e}. Using offline React template.")

        # Clean up code imports from JSX (remove export default App / React imports if Babel standalone conflicts)
        clean_jsx = self._prepare_babel_jsx(app_jsx)
        
        # Write files
        # 1. Write the clean React code
        with open(os.path.join(target_dir, "App.jsx"), "w", encoding="utf-8") as f:
            f.write(clean_jsx)
            
        # 2. Write the original raw JSX (for export purposes)
        with open(os.path.join(target_dir, "App_raw.jsx"), "w", encoding="utf-8") as f:
            f.write(app_jsx)
            
        # 3. Create the Babel wrapper index.html
        index_html = self._get_babel_wrapper_html(seo_meta, prompt)
        with open(os.path.join(target_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(index_html)
            
        # 4. Save metadata JSON
        meta_data = {
            "prompt": prompt,
            "suggestions": suggestions,
            "seo": seo_meta
        }
        with open(os.path.join(target_dir, "metadata.json"), "w", encoding="utf-8") as f:
            json.dump(meta_data, f, indent=2)

        preview_url = f"/generated_sites/{site_name}/index.html"
        print(f"[Site Generator] Website written successfully! Preview URL: {preview_url}")
        
        return {
            "site_name": site_name,
            "preview_url": preview_url,
            "suggestions": suggestions,
            "seo": seo_meta,
            "files": ["App.jsx", "index.html", "metadata.json"]
        }

    def _prepare_babel_jsx(self, raw_jsx):
        """Prepares raw React JSX code for direct rendering in Babel standalone inside browser."""
        code = raw_jsx
        
        # Remove standard ES imports (like import React from 'react') to avoid syntax errors in Babel standalone
        lines = code.split("\n")
        clean_lines = []
        for line in lines:
            if line.strip().startswith("import ") or line.strip().startswith("export default "):
                continue
            clean_lines.append(line)
            
        code = "\n".join(clean_lines)
        
        # Append Babel Standalone rendering invocation
        render_code = """
// Mount component to Babel standalone root
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
"""
        return code + "\n" + render_code

    def _get_babel_wrapper_html(self, seo, prompt):
        return f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{seo.get('title', 'AI Generated App')}</title>
    <meta name="description" content="{seo.get('description', '')}">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Tailwind Play CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {{
        darkMode: 'class',
        theme: {{
          extend: {{
            fontFamily: {{
              sans: ['Inter', 'Outfit', 'sans-serif'],
              display: ['Outfit', 'sans-serif'],
            }},
            colors: {{
              neonCyan: '#00f3ff',
              neonBlue: '#0066ff',
              neonPurple: '#bd00ff',
            }}
          }}
        }}
      }}
    </script>
    <!-- React & Babel Standalone -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
    <div id="root"></div>
    <!-- Script app.jsx loading -->
    <script type="text/babel" src="App.jsx"></script>
</body>
</html>
"""

    def export_project_zip(self, site_name):
        """Bundles Vite + React + Tailwind configs and generated App.jsx into a zip package."""
        target_dir = os.path.join(SITES_DIR, site_name)
        if not os.path.exists(target_dir):
            raise FileNotFoundError(f"Site directory '{site_name}' not found.")
            
        raw_app_path = os.path.join(target_dir, "App_raw.jsx")
        if os.path.exists(raw_app_path):
            with open(raw_app_path, "r", encoding="utf-8") as f:
                app_content = f.read()
        else:
            with open(os.path.join(target_dir, "App.jsx"), "r", encoding="utf-8") as f:
                app_content = f.read()

        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            # 1. package.json
            package_json = {
                "name": site_name,
                "private": True,
                "version": "1.0.0",
                "type": "module",
                "scripts": {
                    "dev": "vite",
                    "build": "vite build",
                    "preview": "vite preview"
                },
                "dependencies": {
                    "react": "^18.3.1",
                    "react-dom": "^18.3.1"
                },
                "devDependencies": {
                    "@types/react": "^18.3.3",
                    "@types/react-dom": "^18.3.0",
                    "@vitejs/plugin-react": "^4.3.1",
                    "autoprefixer": "^10.4.19",
                    "postcss": "^8.4.38",
                    "tailwindcss": "^3.4.4",
                    "vite": "^5.3.1"
                }
            }
            zip_file.writestr("package.json", json.dumps(package_json, indent=2))
            
            # 2. tailwind.config.js
            tailwind_config = """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neonCyan: '#00f3ff',
        neonBlue: '#0066ff',
        neonPurple: '#bd00ff',
      }
    },
  },
  plugins: [],
}
"""
            zip_file.writestr("tailwind.config.js", tailwind_config)
            
            # 3. postcss.config.js
            postcss_config = """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"""
            zip_file.writestr("postcss.config.js", postcss_config)
            
            # 4. vite.config.js
            vite_config = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
"""
            zip_file.writestr("vite.config.js", vite_config)
            
            # 5. index.html
            index_html = """<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Generated React App</title>
  </head>
  <body class="bg-slate-950 text-slate-100">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
"""
            zip_file.writestr("index.html", index_html)
            
            # 6. src/main.jsx
            main_jsx = """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
"""
            zip_file.writestr("src/main.jsx", main_jsx)
            
            # 7. src/index.css
            index_css = """@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}
"""
            zip_file.writestr("src/index.css", index_css)
            
            # 8. src/App.jsx
            # Ensure it has React import and exports correctly
            final_app_code = app_content
            if "import React" not in final_app_code:
                final_app_code = "import React, { useState } from 'react';\n" + final_app_code
            if "export default App" not in final_app_code:
                final_app_code = final_app_code + "\n\nexport default App;\n"
                
            zip_file.writestr("src/App.jsx", final_app_code)
            
            # 9. README.md
            readme = f"""# AI Generated Project: {site_name}

This project was compiled dynamically by Shubham AI's Web Engine.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the Vite development server:
   ```bash
   npm run dev
   ```

3. Open your browser to the local URL (usually `http://localhost:5173`).
"""
            zip_file.writestr("README.md", readme)
            
        zip_buffer.seek(0)
        return zip_buffer.getvalue()

    def _get_offline_react_app(self, prompt):
        template = """// Offline generated template
const App = () => {
  const [theme, setTheme] = useState('dark');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.className = nextTheme;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setFormSubmitted(true);
      setTimeout(() => setFormSubmitted(false), 3000);
      setEmail('');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className="border-b border-slate-800/40 px-6 py-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span className="font-bold text-sm tracking-wider uppercase">Offline Sandbox</span>
        </div>
        <nav className="hidden md:flex gap-6 text-xs font-medium opacity-80">
          <a href="#hero" className="hover:text-cyan-400 transition-colors">Home</a>
          <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
          <a href="#contact" className="hover:text-cyan-400 transition-colors">Connect</a>
        </nav>
        <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700 transition-all text-xs font-mono">
          {theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}
        </button>
      </header>

      {/* Hero */}
      <section id="hero" className="max-w-4xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full text-[10px] font-mono tracking-widest uppercase mb-6">
          OFFLINE FALLBACK SITE
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          __PROMPT__
        </h1>
        <p className="text-sm md:text-base opacity-70 max-w-2xl leading-relaxed mb-8">
          This single-page React + Tailwind component is a placeholder generated offline. Configure an OpenAI API key in your backend `.env` variables to unleash AI compilation of custom designs!
        </p>
        <div className="flex gap-4">
          <a href="#features" className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg hover:shadow-cyan-500/20 text-xs font-bold text-slate-950 transition-all">
            Explore Features
          </a>
          <a href="#contact" className="px-6 py-3 rounded-full border border-slate-700 hover:bg-slate-800 text-xs font-bold transition-all">
            Get in Touch
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-900/30 border-y border-slate-800/20 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">Core Advantages</h2>
            <p className="text-xs opacity-60">Engineered with high performance React code templates.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-850 hover:border-cyan-500/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 className="font-bold text-sm mb-2">React + Tailwind</h3>
              <p className="text-xs opacity-60 leading-relaxed">Dynamic states, responsive styling, and fast components rendered natively.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-850 hover:border-cyan-500/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
              </div>
              <h3 className="font-bold text-sm mb-2">Mobile Ready</h3>
              <p className="text-xs opacity-60 leading-relaxed">Completely responsive grids that adapt beautifully from small mobile screens to large desktop monitors.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-850 hover:border-cyan-500/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 className="font-bold text-sm mb-2">Secure & Clean</h3>
              <p className="text-xs opacity-60 leading-relaxed">Structured markup containing meta tags, friendly headings, and semantic DOM elements for optimal SEO performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-md mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Subscribe for Updates</h2>
        <p className="text-xs opacity-60 mb-6">Stay notified as we build and compile futuristic sites.</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address..."
            required
            className="flex-1 bg-slate-900/80 border border-slate-850 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500/40 text-slate-100"
          />
          <button type="submit" className="bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs hover:bg-cyan-400 transition-colors">
            Subscribe
          </button>
        </form>
        {formSubmitted && (
          <p className="text-xs text-emerald-400 font-semibold mt-3 animate-pulse">
            Awesome! Subscription registered successfully!
          </p>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/40 py-8 text-center text-[10px] opacity-40">
        <p>&copy; 2026 Shubham AI Web Builder. Created with React & Tailwind.</p>
      </footer>
    </div>
  );
};
"""
        return template.replace("__PROMPT__", prompt)
