(function (App) {
    'use strict';

    var turndownService = new TurndownService({
        codeBlockStyle: 'fenced',
        emDelimiter: '_',
        bulletListMarker: '-',
        headingStyle: 'atx'
    });

    turndownService.use(turndownPluginGfm.gfm);

    App.TurndownService = turndownService;

})(window.App = window.App || {});
