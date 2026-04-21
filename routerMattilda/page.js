class PageMattilda {
    constructor(url) {
        this.url = 'viewsMattilda/' + url;
    }

    load() {
        return $.get(this.url).then(res => this.html = res);
    }

    show(el) {
        el.innerHTML = this.html;
    }
}
