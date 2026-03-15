"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
//   palette: {
//     mode: "dark",
//     primary: {
//       main: "#7c4dff",
//       light: "#b47cff",
//       dark: "#3f1dcb",
//     },
//     secondary: {
//       main: "#00e5ff",
//       light: "#6effff",
//       dark: "#00b2cc",
//     },
//     background: {
//       default: "#0a0a0a",
//       paper: "#141414",
//     },
//   },
  typography: {
    fontFamily: "'Source Sans Pro', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h3: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
//   shape: {
//     borderRadius: 12,
//   },
//   components: {
//     MuiButton: {
//       styleOverrides: {
//         root: {
//           textTransform: "none",
//           fontWeight: 600,
//           padding: "10px 24px",
//         },
//         sizeLarge: {
//           fontSize: "1rem",
//           padding: "12px 32px",
//         },
//       },
//     },
//     MuiCard: {
//       styleOverrides: {
//         root: {
//           backgroundImage: "none",
//         },
//       },
//     },
//     MuiTextField: {
//       defaultProps: {
//         variant: "outlined",
//       },
//     },
//   },
});

export default theme;
