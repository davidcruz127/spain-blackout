
# ⚡ Spain Blackout

**Spain Blackout** es un juego web inspirado en *Flappy Bird*, donde debes gestionar el equilibrio de la red eléctrica española evitando sobrevoltajes y apagones. Tu objetivo: mantener el sistema en marcha el mayor tiempo posible.

---

### 🎮 ¿Cómo se juega?

- Pulsa o toca la pantalla para mantener la bola energética en el aire.
- Evita las tuberías rojas (producción) por arriba y las azules (consumo) por abajo.
- La dificultad aumenta con el tiempo.
- Si colisionas, verás una explosión ⚡ y efectos únicos según el tipo de fallo:
  - ⚡ Sobrecarga
  - 💡 Apagón
  - 🔌 Pérdida de control

---

### 🧠 Características

- Bola centrada con fondo parallax animado.
- Explosión eléctrica, partículas, y sonido personalizado según el tipo de fallo.
- Sonido adicional para "Pérdida de control".
- Ranking global y puntuación máxima local (guardada con `localStorage`).
- Botón "Volver al menú" tras el Game Over.
- Leyenda visual de tipos de tuberías.
- Totalmente responsive (funciona en móvil y escritorio).

---

### 📱 Vista en móvil

El juego se adapta automáticamente a pantallas móviles. Puedes jugar desde el navegador o publicarlo en plataformas como GitHub Pages o Netlify.

---

### 🚀 Cómo jugar localmente

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/spain-blackout.git
   cd spain-blackout
   ```

2. Inicia un servidor local:
   ```bash
   python -m http.server
   ```

3. Abre tu navegador en:
   ```
   http://localhost:8000
   ```

---

### 📂 Estructura del proyecto

```
├── index.html
├── style.css
├── main.js
├── fondo.jpg
└── sounds/
    ├── jump.mp3
    ├── blackout.mp3
    ├── overvoltage.mp3
    ├── default.mp3
    ├── charge.mp3
    └── end.mp3
```

---

### 👨‍💻 Autor

Desarrollado por davidcruz127  
📍 Hecho con ❤️ en España

---

¡Siente el poder de la red eléctrica y evita el apagón!
