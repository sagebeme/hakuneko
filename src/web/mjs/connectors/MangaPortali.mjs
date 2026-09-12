import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';

export default class MangaPortali extends Connector {

    constructor() {
        super();
        super.id = 'mangaportali';
        super.label = 'Manga Portalı';
        this.tags = ['manga', 'turkish'];
        this.url = 'https://www.mangaportali.com';
    }

    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const [ title ] = await this.fetchDOM(request, 'h1');
        return new Manga(this, uri.pathname, title.textContent.trim());
    }

    async _getMangas() {
        const uri = new URL('/series', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'a[href^="/series/"] img[alt]');
        return data.map(element => {
            return {
                id: element.closest('a').getAttribute('href'),
                title: element.getAttribute('alt').replace(/\s*kapak görseli\s*$/i, '').trim()
            };
        });
    }

    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'a[href*="/reader/"]');
        // the manga page also has "first chapter" / "latest chapter" shortcut buttons
        // *before* the real (newest-first) chapter list, linking to the same URLs;
        // reverse first so the real, properly titled entries are seen before their
        // shortcut duplicates, then drop the duplicates
        const seen = new Set();
        return data.slice().reverse().map(element => {
            return {
                id: element.getAttribute('href'),
                title: (element.querySelector('p') || element).textContent.trim()
            };
        }).filter(chapter => {
            if(seen.has(chapter.id)) {
                return false;
            }
            seen.add(chapter.id);
            return true;
        });
    }

    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'img[alt^="Sayfa"]');
        return data
            .sort((a, b) => parseInt(a.alt.match(/\d+/)) - parseInt(b.alt.match(/\d+/)))
            .map(element => element.src);
    }
}
