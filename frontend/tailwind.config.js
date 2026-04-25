/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Bikini Bottom daytime palette
        ocean: {
          50: "#eaf8ff",
          100: "#cdeeff",
          200: "#9bdcff",
          300: "#5fc5ff",
          400: "#2badf7",
          500: "#0a8fd8",
          600: "#0070ae",
          700: "#00598c",
          800: "#004872",
          900: "#03385a",
        },
        sand: {
          50: "#fffbe6",
          100: "#fff4b8",
          200: "#ffe97a",
          300: "#ffde3f",
          400: "#ffcf1f",
          500: "#f5b301", // SpongeBob yellow
          600: "#d69100",
          700: "#a46b00",
          800: "#6e4700",
          900: "#3d2700",
        },
        coral: {
          50: "#fff1f2",
          100: "#ffe0e4",
          200: "#ffb6c1",
          300: "#ff8aa0",
          400: "#ff5f7e",
          500: "#f73d66", // Patrick pink
          600: "#d7204d",
          700: "#a61640",
          800: "#73102d",
          900: "#410919",
        },
        seaweed: {
          400: "#4fd48a",
          500: "#1fbf6b",
          600: "#0f9a54",
        },
        // Bikini Bottom Night palette
        night: {
          900: "#03132a",
          800: "#061e44",
          700: "#0a2d63",
          600: "#103e85",
          500: "#1a55ad",
        },
      },
      fontFamily: {
        // Google Fonts "Bowlby One" & "Chewy" approximate the SpongeBob/Krabby Patty vibe
        display: [
          '"Bowlby One SC"',
          '"Chewy"',
          '"Luckiest Guy"',
          "Impact",
          "sans-serif",
        ],
        heading: ['"Chewy"', '"Bowlby One SC"', "cursive"],
        body: ['"Nunito"', '"Poppins"', '"Comic Neue"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        bubble:
          "0 10px 25px -5px rgba(10, 143, 216, 0.25), 0 8px 10px -6px rgba(10, 143, 216, 0.2)",
        coral: "0 10px 30px -10px rgba(247, 61, 102, 0.45)",
        sun: "0 10px 30px -10px rgba(245, 179, 1, 0.45)",
        soft: "0 6px 20px rgba(2, 28, 58, 0.08)",
      },
      backgroundImage: {
        "ocean-gradient":
          "linear-gradient(180deg, #cdeeff 0%, #9bdcff 45%, #5fc5ff 100%)",
        "sunbeam":
          "radial-gradient(ellipse at top, rgba(255,245,180,0.75), rgba(205,238,255,0) 60%)",
        "night-gradient":
          "linear-gradient(180deg, #03132a 0%, #061e44 50%, #0a2d63 100%)",
      },
      keyframes: {
        float: {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0.0" },
          "10%": { opacity: "0.6" },
          "50%": { opacity: "0.9" },
          "100%": {
            transform: "translateY(-110vh) scale(1.1)",
            opacity: "0",
          },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        bobble: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(4deg)" },
        },
      },
      animation: {
        float: "float linear infinite",
        wiggle: "wiggle 2s ease-in-out infinite",
        bobble: "bobble 3s ease-in-out infinite",
        sway: "sway 6s ease-in-out infinite",
      },
      borderRadius: {
        blob: "42% 58% 63% 37% / 45% 37% 63% 55%",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
