declare var g_sessionID;

declare var g_pse_y_format: string;
declare var g_plotPriceHistory;
declare var Market_OrderSpreadPlot;
declare var g_pse_custom_graph;
declare var g_pse_zoom_data: ZoomData;
declare var g_pse_data: [[string, number, string][], [string, number, string][]];

declare var g_timePriceHistoryEarliest;
declare var g_timePriceHistoryLatest;

declare var g_pse_currentModal: CModal;

declare var g_oMyListings: CAjaxPagingControls;
declare var g_oMyHistory: CAjaxPagingControls;

declare var g_pse_listingdata: {
    [price: string]: {
        [date: string]: {
            itemid: string,
            listingid: string
        }[]
    }[]
};

declare var g_bBusyLoadingMarketHistory;

declare function g_pse_showModal(content: string): void;
declare function g_pse_dismissModal(): void;
declare function g_pse_advancedPaging(iPage: any, oPagingControl: CAjaxPagingControls): void;

declare function LoadMarketHistory(): unknown;

declare function CancelMarketBuyOrder(buy_order_id): unknown;

declare function MergeWithAssetArray(nIn: any): void;

declare function pricehistory_zoomMonthOrLifetime(plot: any, earliest: any, latest: any): void;

declare function $(selector: any)
declare function $J(selector: any): $J.$JR;

declare function CModal($Jcontent, params?): void;

declare function CAjaxPagingControls(options: any, ajaxUrl: string): void;

declare interface CModal {

    Show(): void;
    Dismiss(): void;

}

declare interface CAjaxPagingControls {

    readonly m_bLoading: boolean;
    readonly m_cMaxPages: number;
    readonly m_cPageSize: number;
    readonly m_cTotalCount: number;
    readonly m_iCurrentPage: number;

    GoToPage(iPage: number, bForce?: boolean): void;
    SetResponseHandler(callback: (response) => void): void;

}

declare module $J {

    export interface $JR {
        children: () => $JR;
        first: () => $JR;
        remove: () => $JR;
    }

    export module jqplot {
        export var DateAxisRenderer;
    }

    export function jqplot(id: string, data: any[], options: {
        [a: string]: any
    }): unknown;

}

declare module Ajax {

    export function Request(url: string, options: {
        method: string,
        parameters?: {
            [name: string]: any
        },
        onSuccess?: (transport) => void,
        onComplete?: (transport) => void,
        onFailure?: (transport) => void
    }): void;

}

type ZoomData = {
    [key in 'week' | 'one_month' | 'six_month' | 'lifetime']?: [number, number]
};
