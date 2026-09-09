import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    components: {
        // 1. Global Page Background Overrides
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundImage: 'url("/bg-launch-screen.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                    minHeight: '100vh',
                },
            },
        },

        // 2. Global Button Component Overrides
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '999px', // Custom border-radius from Figma
                    textTransform: 'none', // Prevents MUI from converting text to UPPERCASE
                    fontWeight: 600,
                    padding: '12px 24px',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)', // Figma drop shadow
                    transition: 'all 0.2s ease-in-out',
                },
            },
            variants: [
                {
                    props: { variant: 'contained', color: 'primary' },
                    style: {
                        backgroundColor: '#AC2F29',
                        '&:hover': {
                            backgroundColor: '#972923',
                            boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.2)',
                        },
                    },
                },
            ],
        },
    },
});