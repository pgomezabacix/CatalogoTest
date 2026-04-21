class RouterMattilda {
    constructor(routes, el) {
        this.routes = routes;
        this.el = el;
        window.onhashchange = this.hashChanged.bind(this);
        this.hashChanged();
    }

    async hashChanged() {
        const hash = window.location.hash;
        const pageName = hash.length > 0 ? hash.slice(1) : null;

        if (pageName && this.routes[pageName]) {
            await this.show(pageName);
            this.updateActiveTab(pageName);
        } else if (this.routes['#default']) {
            await this.show('#default');
        }
    }

    async show(pageName) {
        const page = this.routes[pageName];
        await page.load();
        this.el.innerHTML = '';
        page.show(this.el);
        if (typeof makeFootable === 'function') makeFootable();
        if (typeof makeTooltips === 'function') makeTooltips();
    }

    updateActiveTab(pageName) {
        document.querySelectorAll('.nav--tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('href') === '#' + pageName) {
                tab.classList.add('active');
            }
        });
    }
}
