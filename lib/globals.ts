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
    g_rgWalletInfo: g_rgWalletInfo
} = {
    g_rgWalletInfo: null
};

module globals {

    let requireGlobals = [
        'g_rgWalletInfo'
    ];

    window.addEventListener('message', (e: MessageEvent<[string, { map: string, global: any }]>) => {
        // console.debug(e.data);
        if ((e?.data ?? ['', null])[0] == 'ISL_GLOBALS') {
            steam_globals[e.data[1].map] = e.data[1].global;

            console.debug(`[${Util.STATIC_ID.NAME}] Getting Steam global:`, steam_globals);
        }
    });

    function psePushGlobal(global: string): string {
        return `var ${global} = ${global} ?? null;\nif (${global}) { window.postMessage(['ISL_GLOBALS',{map:'${global}',global:${global}}], '*'); }`;
    }

    let g_code = '';
    for (let l_global of requireGlobals) {
        g_code += `${psePushGlobal('g_rgWalletInfo')}\n`;
    }

    InjectionServiceLib.injectCode(g_code, 'body');

}
