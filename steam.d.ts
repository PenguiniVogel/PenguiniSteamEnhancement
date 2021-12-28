declare var g_sessionID;

declare var g_plotPriceHistory;

declare var g_timePriceHistoryEarliest;
declare var g_timePriceHistoryLatest;

declare var g_pse_currentModal: CModal;

declare function g_pse_showModal(content: string): void;
declare function g_pse_dismissModal(): void;

declare var g_pse_listingdata: {
    [price: string]: {
        itemid: string,
        listingid: string
    }[]
};

declare function pricehistory_zoomMonthOrLifetime(plot: any, earliest: any, latest: any): void;

declare function $J(selector: string | HTMLElement): any;

declare module $J {

    export module jqplot {
        export var DateAxisRenderer;
    }

    export function jqplot(id: string, data: any[], options: {
        [a: string]: any
    }): unknown;

}

declare class CModal {

    constructor($Jcontent, params?)

    public Show(): void

    public Dismiss(): void

}

declare module Ajax {

    export function Request(url: string, options: {
        method: string,
        parameters?: {
            [name: string]: any
        },
        onSuccess?: (transport) => void,
        onFailure?: (transport) => void
    }): void;

}
