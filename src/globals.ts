const STATIC_ID = {
    MODAL: 'PSE_MODAL',
    NAME: 'PSE'
};

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

}
