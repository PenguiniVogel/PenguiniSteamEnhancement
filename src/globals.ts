const enum STATIC_ID {
    MODAL = 'PSE_MODAL',
    NAME = 'PSE'
}

interface g_rgWalletInfo {
    rwgrsn: number;
    success: number;
    wallet_balance: string;
    wallet_country: string;
    wallet_currency: number;
    wallet_delayed_balance: string;
    wallet_fee: string;
    wallet_fee_base: string;
    wallet_fee_minimum: string;
    wallet_fee_percent: string;
    wallet_max_balance: string;
    wallet_publisher_fee_percent_default: string;
    wallet_state: string;
    wallet_trade_max_balance: string;
}

let steam_globals: {
    g_rgWalletInfo: g_rgWalletInfo,
    g_plotPriceHistory_y_format: any
} = {
    g_rgWalletInfo: null,
    g_plotPriceHistory_y_format: null
};

module globals {

    let requireGlobals = [
        'g_rgWalletInfo',
        // 'g_plotPriceHistory'
    ];

    let requireValues = {
        'g_plotPriceHistory_y_format': `null;\nvar g_plotPriceHistory = g_plotPriceHistory ?? null;\nif (g_plotPriceHistory) { g_plotPriceHistory_y_format = g_plotPriceHistory?.options?.axes?.yaxis?.tickOptions?.formatString ?? '%0.2f' }`
    };

    window.addEventListener('message', (e: MessageEvent<[string, { map: string, global?: any, value?: any }]>) => {
        // console.debug(e.data);
        if ((e?.data ?? ['', null])[0] == 'ISL_GLOBALS_OBJECT') {
            steam_globals[e.data[1].map] = e.data[1].global;

            console.debug(`[PSE] Getting Steam global:`, steam_globals);
        } else if ((e?.data ?? ['', null])[0] == 'ISL_GLOBALS_VALUE') {
            steam_globals[e.data[1].map] = e.data[1].value;

            console.debug(`[PSE] Getting Steam global:`, steam_globals);
        }
    });

    function psePushGlobalObject(global: string): string {
        return `var ${global} = ${global} ?? null;
        if (${global}) { window.postMessage(['ISL_GLOBALS_OBJECT', { map: '${global}', global: ${global} }], '*'); }`;
    }

    function psePushGlobalValue(key: string): string {
        return `var ${key} = ${requireValues[key]};
        if (${key}) { window.postMessage(['ISL_GLOBALS_VALUE', { map: '${key}', value: ${key} }], '*'); }`;
    }

    let g_code = '';
    for (let l_global of requireGlobals) {
        g_code += `${psePushGlobalObject(`${l_global}`)}\n`;
    }

    for (let l_kvalue of Object.keys(requireValues)) {
        g_code += `${psePushGlobalValue(l_kvalue)}\n`;
    }

    InjectionServiceLib.injectCode(g_code, 'body');

    export function addBuyOrderCancelConfirmation(): void {
        function g_pse_cancel_buyorder(name: string, id: string): void {
            let modal_content = `
            <div>
                <div style="text-align: left; font-size: 18px; font-weight: 500; color: #fff; margin-bottom: 5px;">Remove a Buy Order</div>
                <div>Cancel Buy Order: <a style="font-weight: 600; color: #fff; cursor: default;">${name}</a></div>
                <div style="margin-top: 10px;">
                    <a style="padding: 10px;" class="btn_green_white_innerfade btn_medium_wide" href="javascript:CancelMarketBuyOrder('${id}');">Yes</a>
                    <a style="margin-right: 5px; pointer-events: none; cursor: default;"></a>
                    <a style="padding: 10px;" class="btn_grey_white_innerfade btn_medium_wide" href="javascript:g_pse_dismissModal();">Cancel</a>
                </div>
            </div>
            `;

            g_pse_showModal(modal_content);
        }

        InjectionServiceLib.injectCode(`${g_pse_cancel_buyorder.toString()}`, 'body');

        let listBuyOrders = <NodeListOf<HTMLElement>>document.querySelectorAll('div[id^="mybuyorder_"]');

        for (let i = 0, l = listBuyOrders.length; i < l; i ++) {
            let row = listBuyOrders.item(i);
            let buyOrderName = row.querySelector('span[id^="mbuyorder_"] a[href]').innerHTML;
            let cancelButton = row.querySelector('div.market_listing_cancel_button a[href]');
            let buyOrderId = /\d+/.exec(cancelButton.getAttribute('href'))[0];

            cancelButton.setAttribute('href', `javascript:g_pse_cancel_buyorder('${buyOrderName}', '${buyOrderId}');`);
        }
    }

}
