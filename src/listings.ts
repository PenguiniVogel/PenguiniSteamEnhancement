module Listings {

    import storedOptions = Options.storedOptions;

    interface ItemActivityTicker {
        Start: (p: any) => void
    }

    declare var ItemActivityTicker: ItemActivityTicker;

    const enum MessageEventType {
        HEAD = '_PenguiniSteamEnhancement',
        BUY_IMMEDIATELY = 'BUY_IMMEDIATELY'
    }

    window.onmessage = (e) => {
        if (!e?.data?.length) return;
        if (e.data[0] != MessageEventType.HEAD) return;

        if (e.data[1] == MessageEventType.BUY_IMMEDIATELY) {
            console.log(e.data[2]);

            let aHref = <HTMLElement>document.querySelector(`a[href="${e.data[2]}"]`);

            aHref.click();

            setTimeout(() => {
                let inputSSA = <HTMLInputElement>document.getElementById('market_buynow_dialog_accept_ssa');

                inputSSA.checked = true;
                inputSSA.value = '1';

                document.getElementById('market_buynow_dialog_purchase').click();
            }, 150);
        }
    };

    export function init(): void {
        console.debug('[PSE] Initialize listings.ts');

        // add modal
        Modal.initModal();

        // add item activity if not present
        if (storedOptions[Options.ID.FORCE_ITEM_ACTIVITY] && !document.getElementById('market_activity_section')) {
            addItemActivity();
        }

        // buy immediately
        // DANGER! Removed for now
        // setInterval(() => addBuyImmediately(), 1000);

        // add view on buff
        if (storedOptions[Options.ID.ADD_VIEW_ON_BUFF]) {
            addViewOnBuff();
        }

        // hide account name
        // hide billing address
        if (storedOptions[Options.ID.HIDE_ACCOUNT_DETAILS]) {
            hideAccountName();
            hideBillingAddress();
        }

        // merge active listings
        if (storedOptions[Options.ID.MERGE_ACTIVE_LISTINGS]) {
            mergeMyActiveListings();
        }

        // inject custom price graph
        // injectPriceGraphFix();

        // add buy order cancel confirmation
        if (storedOptions[Options.ID.BUYORDER_CANCEL_CONFIRMATION]) {
            globals.addBuyOrderCancelConfirmation();
        }
    }

    function addItemActivity(): void {
        let bodyScripts = document.querySelectorAll('body script:not([src])');
        let itemId: number;

        for (let i = 0, l = bodyScripts.length; i < l; i ++) {
            let scriptTag = bodyScripts.item(i);
            let functionString = scriptTag.innerHTML.match(/(Market_LoadOrderSpread\(.*\);)/gm);
            let matchedId = (functionString ?? [''])[0].match(/\d+/g);

            if (matchedId?.length > 0) {
                itemId = +matchedId[0];

                break;
            }
        }

        let listingDiv = document.querySelector('div.market_listing_iteminfo');
        let activityDiv = document.createElement('div');

        activityDiv.setAttribute('id', 'market_activity_section');
        activityDiv.innerHTML = `
<hr/>
<h3 class="market_activity_header">Recent activity</h3>
<div id="market_activity_block">
    <div id="market_activity_waiting_text">Waiting for new activity...</div>
    <div style="display: none;" class="market_activity_line_item ellipsis"></div>
    <div style="display: none;" class="market_activity_line_item ellipsis"></div>
    <div style="display: none;" class="market_activity_line_item ellipsis"></div>
</div>
<a data-for="activate-activity" style="display: none;" onclick="ItemActivityTicker.Start(${itemId});"></a>`;

        listingDiv.append(activityDiv);

        setTimeout(() => {
            let activator = <HTMLElement>document.querySelector('a[data-for="activate-activity"]');

            activator.click();
            console.debug('[PSE] Added market activity.');

            try {
                activator.remove();
            } catch { }
        }, 150);
    }

    function addViewOnBuff(): void {
        let container = document.querySelector('#largeiteminfo_item_actions');
        let game_name = document.querySelector('#largeiteminfo_game_name');

        if (!container || !game_name) return;

        // we aren't on a csgo page so ignore for now
        if (game_name.innerHTML.indexOf('Counter-Strike: Global Offensive') == -1) return;

        let newAhref = document.createElement('a');

        // item name from url, as that isn't translated
        let windowHref = window?.location?.href;
        let link_match: string | RegExpMatchArray = /730\/(.*)[?#]?/g.exec(windowHref);

        if (link_match?.length < 2) return;

        link_match = decodeURIComponent(link_match[1]);

        let special_quality: string | RegExpMatchArray = /^(★(?: StatTrak™)?|StatTrak™|Souvenir)/g.exec(link_match) ?? ['-1'];
        let itemName = link_match;

        switch (special_quality[0]) {
            case '★':
            case '★ StatTrak™':
            case 'StatTrak™':
            case 'Souvenir':
                itemName = itemName.substr(special_quality[0].length + 1);
                break;
            case '-1':
                break;
        }

        switch (special_quality[0]) {
            case '★':
                special_quality = 'unusual';
                break;
            case '★ StatTrak™':
                special_quality = 'unusual_strange';
                break;
            case 'StatTrak™':
                special_quality = 'strange';
                break;
            case 'Souvenir':
                special_quality = 'tournament';
                break;
            case '-1':
                special_quality = 'normal';
                break;
        }

        let wear_test = /Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred/gi.test(itemName);

        console.debug('[PSE]', special_quality, itemName, wear_test);

        newAhref.setAttribute('class', 'btn_small btn_grey_white_innerfade');
        newAhref.setAttribute('href', `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(itemName)}${wear_test ? `&quality=${special_quality}` : ''}`);
        newAhref.setAttribute('target', '_blank');

        newAhref.innerHTML = `<span style="background: #2e2a35; color: #ddb362;">View on BUFF</span>`;

        container.appendChild(newAhref);
    }

//     function addBuyImmediately(): void {
//         let buttonContainers = document.querySelectorAll('div.market_listing_right_cell.market_listing_action_buttons');
//
//         let count = 0;
//         for (let i = 0, l = buttonContainers.length; i < l; i ++) {
//             let buttonContainer = <HTMLElement>buttonContainers.item(i);
//
//             if (buttonContainer?.getAttribute('data-adjusted') == 'true') continue;
//
//             count ++;
//
//             buttonContainer.setAttribute('data-adjusted', 'true');
//
//             let aHrefOther = <HTMLElement>buttonContainer.querySelector('a[href]');
//
//             if (!aHrefOther) continue;
//
//             let newButton = document.createElement('div');
//
//             newButton.setAttribute('class', 'market_listing_buy_button');
//
//             newButton.innerHTML = `
// <a onclick="window.postMessage(['${MessageEventType.HEAD}', '${MessageEventType.BUY_IMMEDIATELY}', '${aHrefOther.getAttribute('href').replace(/'/g, '\\\'')}'], '*');" class="item_market_action_button btn_green_white_innerfade btn_small">
//     <span style="padding: 0 5px;">Buy Immediately</span>
// </a>`;
//
//             buttonContainer.append(newButton);
//         }
//
//         if (count > 0) {
//             Util.debug(`Added BuyImmediately to ${count} elements.`);
//         }
//     }

    function hideAccountName(): void {
        let accountNameElements = <NodeListOf<HTMLElement>>document.querySelectorAll('#market_buynow_dialog_myaccountname,#market_buyorder_dialog_myaccountname');

        for (let i = 0, l = accountNameElements.length; i < l; i ++) {
            let accountNameElement = accountNameElements.item(i);

            let accountName = accountNameElement.innerText;

            accountNameElement.setAttribute('data-name', accountName);
            accountNameElement.setAttribute('style', 'cursor: pointer; text-decoration: underline;');

            accountNameElement.innerText = 'Click to show';

            accountNameElement.onclick = () => {
                accountNameElement.innerText = accountNameElement.getAttribute('data-name');
                accountNameElement.setAttribute('style', '');

                let rows = document.querySelectorAll('.market_dialog_billing_address_row');

                for (let i = 0, l = rows.length; i < l; i ++) {
                    rows.item(i).setAttribute('style', '');
                }
            };
        }
    }

    function hideBillingAddress(): void {
        let rows = document.querySelectorAll('.market_dialog_billing_address_row');

        for (let i = 0, l = rows.length; i < l; i ++) {
            rows.item(i).setAttribute('style', 'display: none;');
        }
    }

    function mergeMyActiveListings(): void {
        let container = <HTMLElement>document.querySelector('#tabContentsMyActiveMarketListingsTable');
        let rowContainer = container ? <HTMLElement>container.querySelector('#tabContentsMyActiveMarketListingsRows') : null;

        if (!rowContainer) return;

        let rows = <NodeListOf<HTMLElement>>rowContainer.querySelectorAll('div[id^="mylisting_"]');

        if (rows?.length == 0) return;

        // container.querySelector('div.market_listing_table_header span.market_listing_listed_date').innerHTML = 'COUNT';

        let listingData: {
            name: string,
            border_color: string,
            market_link: string,
            listings: {
                [price: string]: {
                    [date: string]: {
                        itemid: string,
                        listingid: string,
                        img_src: string,
                        img_srcset: string
                    }[]
                }
            }
        } = {
            name: document.querySelector('#largeiteminfo_item_name').innerHTML.trim(),
            border_color: rows.item(0).querySelector('img[id]').getAttribute('style'),
            market_link: document.querySelector('#mainContents div.market_listing_nav a[href*="listings"]').getAttribute('href'),
            listings: {}
        };

        let simpleListingData: {
            [price: string]: {
                [date: string]: {
                    itemid: string,
                    listingid: string
                }[]
            }
        } = {};

        let afterFeePrices: {
            [price: string]: string
        } = {};

        for (let i = 0, l = rows.length; i < l; i ++) {
            let row = rows.item(i);
            let dataA = <HTMLElement>row.querySelector('a[href].item_market_action_button');
            let href = dataA.getAttribute('href');

            let regex = /\d+/g;
            let listingid = '?', itemid = '?';

            for (let i = 0; i < 4; i ++) {
                let match = regex.exec(href);

                switch (i) {
                    case 0:
                        listingid = match[0];
                        break;
                    case 3:
                        itemid = match[0];
                        break;
                    default:
                        break;
                }

                regex.lastIndex ++;
            }

            // Util.debug(listingid, itemid);
            let dateDiv = <HTMLElement>row.querySelector('div.market_listing_listed_date');
            let date = (dateDiv?.innerHTML ?? '?').trim();

            let priceSpans = <NodeListOf<HTMLElement>>row.querySelectorAll('.market_listing_my_price span[title]');
            let price = (priceSpans?.item(0)?.innerText ?? '?').trim();

            afterFeePrices[price] = (priceSpans?.item(1)?.innerText ?? '?').trim();

            let img = <HTMLElement>row.querySelector('img[id]');

            let mergedByPrice = listingData.listings[price] ?? (listingData.listings[price] = {});
            let mergedByDate = mergedByPrice[date] ?? (mergedByPrice[date] = []);

            mergedByDate.push({
                itemid: itemid,
                listingid: listingid,
                img_src: img.getAttribute('src'),
                img_srcset: img.getAttribute('srcset')
            });

            let simpleListingsByPrice = simpleListingData[price] ?? (simpleListingData[price] = {});
            let simpleListingsByDate = simpleListingsByPrice[date] ?? (simpleListingsByPrice[date] = []);
            simpleListingsByDate.push({
                itemid: itemid,
                listingid: listingid,
            });

            row.setAttribute('style', 'display: none;');
        }

        let myListedPrices = Object.keys(listingData.listings).sort((a, b) => a > b ? 1 : -1);

        console.debug('[PSE]', myListedPrices, listingData, simpleListingData);

        // g_ functions

        function g_pse_sendRemove(listingid: string, onSuccess: (transport) => void, onFailure: (transport) => void): void {
            new Ajax.Request(`https://steamcommunity.com/market/removelisting/${listingid}`, {
                method: 'post',
                parameters: {
                    sessionid: g_sessionID
                },
                onSuccess: onSuccess,
                onFailure: onFailure
            });
        }

        function g_pse_removeNextListing(price: string, date: string, id: string): void {
            let next = g_pse_listingdata[price][date][0];

            g_pse_showModal(`
Removing listing... (${next.listingid})
<img style="display: block; margin: 10px auto 0;" src="https://community.cloudflare.steamstatic.com/public/images/login/throbber.gif" alt="Working...">`);

            g_pse_sendRemove(next.listingid, (transport) => {
                g_pse_listingdata[price][date].shift();

                let totalCount = document.querySelector('#my_market_selllistings_number');

                totalCount.innerHTML = `${+totalCount.innerHTML - 1}`;

                document.querySelector(`#mylisting_combined_${id}_count`).innerHTML = `${g_pse_listingdata[price][date].length}`;

                g_pse_dismissModal();

                console.debug('[PSE]', transport);
            }, (transport) => {
                g_pse_dismissModal();

                console.debug('[PSE]', transport);
            });
        }

        function g_pse_removeAllListings(price: string, date: string, id: string): void {
            let listings = g_pse_listingdata[price][date];
            let count = listings.length;
            let at = 0;

            function removeNext(): void {
                let next = g_pse_listingdata[price][date][0];
                at ++;

                if (at >= count) {
                    g_pse_dismissModal();

                    document.querySelector(`#mylisting_combined_${id}`).setAttribute('style', 'display: none;');
                }

                g_pse_showModal(`
Removing listings... (${at} / ${count})<br>(${next.listingid})
<img style="display: block; margin: 10px auto 0;" src="https://community.cloudflare.steamstatic.com/public/images/login/throbber.gif" alt="Working...">`);

                g_pse_sendRemove(next.listingid, (transport) => {
                    g_pse_listingdata[price][date].shift();

                    let totalCount = document.querySelector('#my_market_selllistings_number');

                    totalCount.innerHTML = `${+totalCount.innerHTML - 1}`;

                    document.querySelector(`#mylisting_combined_${id}_count`).innerHTML = `${g_pse_listingdata[price][date].length}`;

                    removeNext();

                    console.debug('[PSE]', transport);
                }, (transport) => {
                    g_pse_dismissModal();

                    console.debug('[PSE]', transport);
                });
            }

            removeNext();
        }

        console.debug('[PSE]', simpleListingData);

        InjectionServiceLib.injectCode(`
var g_pse_listingdata = ${JSON.stringify(simpleListingData)};
${g_pse_sendRemove.toString()}
${g_pse_removeNextListing.toString()}
${g_pse_removeAllListings.toString()}
        `, 'body');

        // make new html

        for (let i = 0, l = myListedPrices.length; i < l; i ++) {
            let price = myListedPrices[i];
            let mergedByDate = listingData.listings[price];
            let dates = Object.keys(mergedByDate);
            for (let x = 0, y = dates.length; x < y; x ++) {
                console.debug('[PSE]', price, dates[x], mergedByDate);
                let data = mergedByDate[dates[x]];
                let newHTML = `
<div class="market_listing_row market_recent_listing_row listing_combined${i}-${x}" id="mylisting_combined_${i}-${x}">
    <img id="mylisting_combined_${i}-${x}_img" src="${data[0].img_src}" srcset="${data[0].img_srcset}" style="${listingData.border_color}" class="market_listing_item_img" alt="img_${listingData.name}">

    <div class="market_listing_right_cell market_listing_edit_buttons placeholder"></div>

    <div class="market_listing_right_cell market_listing_my_price">
        <span class="market_table_value">
            <span class="market_listing_price">
                <span style="display: inline-block;">
                    <span title="This is the price the buyer pays.">${myListedPrices[i]}</span>
                    <br>
                    <span title="This is how much you will receive." style="color: #AFAFAF;">${afterFeePrices[price]}</span>
                </span>
            </span>
        </span>
    </div>

    <div class="market_listing_right_cell market_listing_listed_date can_combine">${dates[x]}</div>

    <div id="mylisting_combined_${i}-${x}_count" class="market_listing_right_cell market_listing_listed_date can_combine">${data.length}</div>

    <div class="market_listing_item_name_block">
        <span id="mylisting_combined_${i}-${x}_name" class="market_listing_item_name" style="color: #D2D2D2;">
            <a class="market_listing_item_name_link" href="${listingData.market_link}">${listingData.name}</a>
        </span>
        <br>
        <span class="market_listing_game_name">Counter-Strike: Global Offensive</span>
        <!--div class="market_listing_listed_date_combined">Listed: ${dates[x]}</div-->
    </div>

    <div class="market_listing_edit_buttons actual_content">
        <div class="market_listing_cancel_button">
            <a href="javascript:g_pse_removeNextListing('${price}', '${dates[x]}', '${i}-${x}');" class="item_market_action_button item_market_action_button_edit nodisable">
                <span class="item_market_action_button_edge item_market_action_button_left"></span>
                <span class="item_market_action_button_contents">Remove</span>
                <span class="item_market_action_button_edge item_market_action_button_right"></span>
                <span class="item_market_action_button_preload"></span>
            </a>
            <a href="javascript:g_pse_removeAllListings('${price}', '${dates[x]}', '${i}-${x}');" class="item_market_action_button item_market_action_button_edit nodisable">
                <span class="item_market_action_button_edge item_market_action_button_left"></span>
                <span class="item_market_action_button_contents">Remove All</span>
                <span class="item_market_action_button_edge item_market_action_button_right"></span>
                <span class="item_market_action_button_preload"></span>
            </a>
        </div>
    </div>
    <div style="clear: both;"></div>
</div>`;

                rowContainer.innerHTML += newHTML;
            }
        }
    }

//     function injectPriceGraphFix(): void {
//         function g_pse_destroy(): void {
//             function replot_Market_OrderSpreadPlot(): void {
//                 if (Market_OrderSpreadPlot) {
//                     Market_OrderSpreadPlot.replot({
//                         cursor: {
//                             zoom: false
//                         }
//                     });
//                 } else {
//                     setTimeout(() => replot_Market_OrderSpreadPlot(), 250);
//                 }
//             }
//
//             replot_Market_OrderSpreadPlot();
//
//             g_plotPriceHistory.destroy();
//         }
//
//         function g_pse_createZoomData(line1: [string, number, string][]): void {
//             // copy Y formatString
//             g_pse_y_format = g_plotPriceHistory?.options?.axes?.yaxis?.tickOptions?.formatString ?? '%0.2f';
//
//             // jqplot
//
//             let dates: string[] = [];
//             let m_prices: [string, number, string][] = [];
//             let m_volumes: [string, number, string][] = [];
//
//             // remap line1
//             console.debug(`[${Util.STATIC_ID.NAME}] Remapping ${line1.length} entries`);
//
//             for (let i = 0, l = line1.length; i < l; i ++) {
//                 let l_data = line1[i];
//                 let date = l_data[0];
//                 let price = +l_data[1];
//                 let volume = +l_data[2];
//
//                 dates[i] = date;
//                 m_prices[i] = [date, price, `${volume}`];
//                 m_volumes[i] = [date, volume, `${price}`];
//             }
//
//             // make zoom data
//             let zoomData: ZoomData = {};
//
//             // last week is always comprised of 24 hours each day for 7 days (7 * 24)
//             // we make sure we have at least 2 weeks of data (2 * 7 * 24)
//             if (dates.length > 2 * 7 * 24) {
//                 zoomData.week = [m_prices.length - (7 * 24), m_prices.length - 1];
//             }
//
//             // last month is always compromised of 24 hours each day for at least 31 days (31 * 24)
//             // we make sure we have at least 2 months of data (31 + 31 * 24)
//             if (dates.length > 31 + (31 * 24)) {
//                 zoomData.one_month = [m_prices.length - (31 * 24), m_prices.length - 1];
//             }
//
//             // last six months is always compromised of 1 month with 31 days with full data (31 * 24) + (31 * 6)
//             // we make sure we have at least 7 months of data (31 * 24) + (31 * 6)
//             if (dates.length > (31 * 24) + (31 * 6)) {
//                 zoomData.six_month = [m_prices.length - ((31 * 24) + (31 * 5)), m_prices.length - 1];
//             }
//
//             zoomData.lifetime = [0, m_prices.length - 1];
//
//             g_pse_zoom_data = zoomData;
//             g_pse_data = [m_prices, m_volumes];
//
//             // console.debug(m_prices, m_volumes);
//
//             // make controls
//             let controls = document.querySelector('div.zoom_controls.pricehistory_zoom_controls');
//
//             controls.setAttribute('class', 'zoom_controls pricehistory_zoom_controls');
//             controls.setAttribute('style', 'margin-top: 15px; margin-bottom: 5px;');
//
//             controls.innerHTML = `
//             Zoom graph
//             <${g_pse_zoom_data.week ? '' : '!--'}a class="zoomopt" onclick="" href="javascript:g_pse_render_custom_graph('week');">Week</a${g_pse_zoom_data.week ? '' : '--'}>
//             <${g_pse_zoom_data.one_month ? '' : '!--'}a class="zoomopt" onclick="" href="javascript:g_pse_render_custom_graph('one_month');">Month</a${g_pse_zoom_data.one_month ? '' : '--'}>
//             <${g_pse_zoom_data.six_month ? '' : '!--'}a class="zoomopt" onclick="" href="javascript:g_pse_render_custom_graph('six_month');">6 Months</a${g_pse_zoom_data.six_month ? '' : '--'}>
//             <${g_pse_zoom_data.lifetime ? '' : '!--'}a class="zoomopt" onclick="" href="javascript:g_pse_render_custom_graph('lifetime');" style="padding-right: 0;">Lifetime</a${g_pse_zoom_data.lifetime ? '' : '--'}>
//             `;
//         }
//
//         function g_pse_render_custom_graph(key: string): void {
//             // jqplot
//             let range = g_pse_zoom_data[key] ?? g_pse_zoom_data.lifetime;
//             let data = [g_pse_data[0].slice(range[0], range[1]), g_pse_data[1].slice(range[0], range[1])];
//
//             let y_max = Math.max(...data[0].map(x => x[1]));
//             let y2_max = Math.max(...data[1].map(x => x[1]));
//
//             y_max = y_max + (y_max * 0.1);
//             y2_max = ~~(y2_max + (y2_max * 0.1));
//
//             if (g_pse_custom_graph) {
//                 g_pse_custom_graph.destroy();
//                 g_pse_custom_graph = null;
//             }
//
//             g_pse_custom_graph = $J.jqplot('pricehistory', data, {
//                 axes: {
//                     xaxis: {
//                         renderer: $J.jqplot.DateAxisRenderer,
//                         tickOptions: {
//                             formatString: '<div style="margin-top: 4px;"></div>%b %#d<br>%Y<span class="priceHistoryTime"> %#I%p<span>'
//                         },
//                         pad: 1
//                     },
//                     yaxis: {
//                         pad: 1.1,
//                         tickOptions: {
//                             formatString: g_pse_y_format,
//                             labelPosition: 'start',
//                             showMark: false
//                         },
//                         numberTicks: 7,
//                         min: 0,
//                         max: y_max
//                     }
//                 },
//                 grid: {
//                     gridLineColor: '#1b2939',
//                     borderColor: '#1b2939',
//                     background: '#101822'
//                 },
//                 gridPadding: {
//                     left: 45,
//                     right: 45,
//                     top: 25
//                 },
//                 axesDefaults: {
//                     showTickMarks: false
//                 },
//                 cursor: {
//                     show: true,
//                     showTooltip: false,
//                     zoom: true
//                 },
//                 highlighter: {
//                     show: true,
//                     lineWidthAdjust: 2.5,
//                     sizeAdjust: 5,
//                     showTooltip: true,
//                     tooltipLocation: 'n',
//                     tooltipOffset: 20,
//                     fadeTooltip: true,
//                     tooltipAxes: 'xy',
//                     yvalues: 2
//                 },
//                 series: [
//                     {
//                         yaxis: 'yaxis',
//                         lineWidth: 3,
//                         markerOptions: {
//                             show: false,
//                             style: 'circle'
//                         },
//                         highlighter: {
//                             formatString: '<b>%s</b><br>%s<br>%s sold'
//                         }
//                     }
//                 ],
//                 seriesColors: [
//                     "#688f3e"
//                 ]
//             });
//
//             // g_pse_custom_graph = $J.jqplot('pricehistory', data, {
//             //     axes: {
//             //         xaxis: {
//             //             renderer: $J.jqplot.DateAxisRenderer,
//             //             tickOptions: {
//             //                 formatString: '<div style="margin-top: 4px;"></div>%b %#d<br>%Y<span class="priceHistoryTime"> %#I%p<span>'
//             //             },
//             //             pad: 1
//             //         },
//             //         yaxis: {
//             //             pad: 1.1,
//             //             tickOptions: {
//             //                 formatString: g_pse_y_format,
//             //                 labelPosition: 'start',
//             //                 showMark: false
//             //             },
//             //             numberTicks: 7,
//             //             min: 0,
//             //             max: y_max
//             //         },
//             //         y2axis: {
//             //             pad: 1.1,
//             //             tickOptions: {
//             //                 formatString: '%0.0f',
//             //                 labelPosition: 'start',
//             //                 showMark: false
//             //             },
//             //             numberTicks: 7,
//             //             min: 0,
//             //             max: y2_max
//             //         }
//             //     },
//             //     grid: {
//             //         gridLineColor: '#1b2939',
//             //         borderColor: '#1b2939',
//             //         background: '#101822'
//             //     },
//             //     gridPadding: {
//             //         left: 45,
//             //         right: 45,
//             //         top: 25
//             //     },
//             //     axesDefaults: {
//             //         showTickMarks: false
//             //     },
//             //     cursor: {
//             //         show: true,
//             //         showTooltip: false,
//             //         zoom: true,
//             //         constrainZoomTo: 'x'
//             //     },
//             //     highlighter: {
//             //         show: true,
//             //         lineWidthAdjust: 2.5,
//             //         sizeAdjust: 5,
//             //         showTooltip: true,
//             //         tooltipLocation: 'n',
//             //         tooltipOffset: 20,
//             //         fadeTooltip: true,
//             //         tooltipAxes: 'xy',
//             //         yvalues: 2
//             //     },
//             //     series: [
//             //         {
//             //             yaxis: 'yaxis',
//             //             lineWidth: 3,
//             //             markerOptions: {
//             //                 show: false,
//             //                 style: 'circle'
//             //             },
//             //             highlighter: {
//             //                 formatString: '<b>%s</b><br>%s<br>%s sold'
//             //             }
//             //         },
//             //         {
//             //             yaxis: 'y2axis',
//             //             lineWidth: 3,
//             //             markerOptions: {
//             //                 show: false,
//             //                 style: 'circle'
//             //             },
//             //             highlighter: {
//             //                 formatString: `<b>%s</b><br>%s sold @ ${g_pse_y_format}`
//             //             }
//             //         }
//             //     ],
//             //     seriesColors: [
//             //         "#688f3e",
//             //         "#6b8fc3"
//             //     ]
//             // });
//
//             $J('#pricehistory .jqplot-yaxis').children().first().remove();
//             $J('#pricehistory .jqplot-y2axis').children().first().remove();
//         }
//
//         // find line1 data
//         let line1 = '';
//         let scripts = document.querySelectorAll('body script');
//
//         for (let i = 0, l = scripts.length; i < l; i ++) {
//             line1 = (/var line1=.*/g.exec(scripts.item(i).innerHTML) ?? [undefined])[0];
//
//             if (line1) break;
//         }
//
//         let pricehistory = document.getElementById('pricehistory');
//
//         // make sure we can graph something
//         if (line1 && pricehistory) {
//             pricehistory.innerHTML = '';
//
//             InjectionServiceLib.injectCode(`
// var g_pse_y_format = null;
// var g_pse_custom_graph = null;
// var g_pse_zoom_data = null;
// var g_pse_data = null;
// ${g_pse_render_custom_graph.toString()}
// (function() {
// ${g_pse_createZoomData.toString()}
// ${line1}
// ${g_pse_destroy.toString()}
// g_pse_destroy();
// g_pse_createZoomData(line1);
// g_pse_render_custom_graph('one_month');
// })();`, 'body');
//         }
//     }

}

setTimeout(() => Listings.init(), 150);
