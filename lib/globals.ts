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

window.addEventListener('message', (e: MessageEvent<{ map: string, global: any }[]>) => {
    // console.debug(e.data);
    if ((e?.data ?? [{ map: '', global: null }])[0]?.map == 'ISL_GLOBALS') {
        for (let i = 1, l = e.data.length; i < l; i ++) {
            let global = e.data[i];

            steam_globals[global.map] = global.global;
        }

        console.debug('[PenguiniSteamEnhancement] Getting Steam globals:', steam_globals);
    }
});

function g_pse_getGlobals(globals: { map: string, global: any }[]): void {
    let origin = <{ map: string, global: any }[]>[{ map: 'ISL_GLOBALS', global: null }];
    globals.forEach(e => origin.push(e));
    window.postMessage(origin, '*');
}

InjectionServiceLib.injectCode(`${g_pse_getGlobals.toString()}\ng_pse_getGlobals([{map:'g_rgWalletInfo',global:g_rgWalletInfo}]);`, 'body');
