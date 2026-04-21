const router = new RouterMattilda(
    {
        colegios: new PageMattilda('colegios.html'),
        usuarios: new PageMattilda('usuarios.html'),
        '#default': new PageMattilda('colegios.html'),
    },
    document.querySelector('main')
);
