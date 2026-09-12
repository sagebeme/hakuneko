import WordPressMadara from './templates/WordPressMadara.mjs';

export default class Inkapk extends WordPressMadara {

    constructor() {
        super();
        super.id = 'inkapk';
        super.label = 'Inkapk';
        this.tags = ['webtoon', 'portuguese'];
        this.url = 'https://inkapk.net';
    }
}
