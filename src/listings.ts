module Listings {

    interface ItemActivityTicker { Start: (p: any) => void }
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
        Util.debug('Initialize.');

        // add modal
        Util.initModal();

        // add item activity if not present
        if (!document.getElementById('market_activity_section')) {
            addItemActivity();
        }

        // buy immediately
        // DANGER! Removed for now
        // setInterval(() => addBuyImmediately(), 1000);

        // add view on buff
        addViewOnBuff();

        // hide account name
        hideAccountName();

        // hide billing address
        hideBillingAddress();

        // merge active listings
        mergeMyActiveListings();

        // inject custom price graph
        injectPriceGraphFix();
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
            Util.debug('Added market activity.');

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

        Util.debug(special_quality, itemName, wear_test);

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

        Util.debug(myListedPrices, listingData, simpleListingData);

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

                Util.debug(transport);
            }, (transport) => {
                g_pse_dismissModal();

                Util.debug(transport);
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

                    Util.debug(transport);
                }, (transport) => {
                    g_pse_dismissModal();

                    Util.debug(transport);
                });
            }

            removeNext();
        }

        Util.debug(simpleListingData);

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
                Util.debug(price, dates[x], mergedByDate);
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

    function injectPriceGraphFix(): void {
        function drawCustomPlot(line1: any): void {
            // copy the original format to make sure we use the right currency and what not, otherwise default to %0.2f
            const yaxis_format = g_plotPriceHistory?.options?.axes?.yaxis?.tickOptions?.formatString ?? '%0.2f';

            g_plotPriceHistory = $J.jqplot('pricehistory', [line1], {
                title: {
                    text: 'Median Sale Prices',
                    textAlign: 'left'
                },
                gridPadding: {
                    left: 45,
                    right:45,
                    top:25
                },
                axesDefaults: {
                    showTickMarks: false
                },
                axes: {
                    xaxis: {
                        renderer: $J.jqplot.DateAxisRenderer,
                        tickOptions: {
                            formatString: '%b %#d<br>%Y<span class="priceHistoryTime"> %#I%p<span>'
                        },
                        pad: 1
                    },
                    yaxis: {
                        pad: 1.1,
                        tickOptions: {
                            formatString: yaxis_format,
                            labelPosition: 'start',
                            showMark: false
                        },
                        numberTicks: 7
                    }
                },
                grid: {
                    gridLineColor: '#1b2939',
                    borderColor: '#1b2939',
                    background: '#101822'
                },
                cursor: {
                    show: true,
                    zoom: true,
                    showTooltip: false
                },
                highlighter: {
                    show: true,
                    lineWidthAdjust: 2.5,
                    sizeAdjust: 5,
                    showTooltip: true,
                    tooltipLocation: 'n',
                    tooltipOffset: 20,
                    fadeTooltip: true,
                    yvalues: 2,
                    formatString: '<strong>%s</strong><br>%s<br>%d sold'
                },
                series: [{
                    lineWidth: 3,
                    markerOptions: {
                        show: false,
                        style: 'circle'
                    }
                }],
                seriesColors: [ "#688F3E" ]
            });

            pricehistory_zoomMonthOrLifetime(g_plotPriceHistory, g_timePriceHistoryEarliest, g_timePriceHistoryLatest);
        }

        function g_pse_render_custom_graph(line1: [string, number, string][]): void {
            const yaxis_format = g_plotPriceHistory?.options?.axes?.yaxis?.tickOptions?.formatString ?? '%0.2f';

            let container = <HTMLElement>document.querySelector('#mainContents div.market_listing_iteminfo');

            let hr = document.createElement('hr');
            let div = document.createElement('div');

            div.setAttribute('id', 'test-graph');
            div.setAttribute('style', 'height: 300px');

            container.append(hr, div);

            // jqplot

            let dates = [];
            let m_prices = [];
            let m_volumes = [];

            // let today = new Date(2022, 1, 1);
            //
            // for (let i = 0, l = 7 * 4; i < l; i ++) {
            //     dates[i] = today;
            //
            //     today = new Date(today.setDate(today.getDate() + 1));
            // }
            //
            // let randomPrices = [];
            // for (let i = 0, l = 7 * 4; i < l; i ++) {
            //     randomPrices[i] = ~~(Math.random() * 100) / 100;
            // }
            //
            // let randomVolumes = [];
            // for (let i = 0, l = 7 * 4; i < l; i ++) {
            //     randomVolumes[i] = ~~(100_000 * ~~(Math.random() * 100) / 100);
            // }
            //
            // for (let i = 0, l = 7 * 4; i < l; i ++) {
            //     m_prices[i] = [dates[i], randomPrices[i], `${randomVolumes[i]}`];
            //     m_volumes[i] = [dates[i], randomVolumes[i], `${randomPrices[i]}`];
            // }

            // remap line1
            console.debug(`[${Util.STATIC_ID.NAME}] Remapping ${line1.length} entries`);

            let y_min = -0.1, y_max = 0;
            let y1_min = -1, y1_max = 0;

            for (let i = 0, l = line1.length; i < l; i ++) {
                let l_data = line1[i];
                let date = l_data[0];
                let price = +l_data[1];
                let volume = +l_data[2];

                y_max = Math.max(y_max, price);
                y1_max = Math.max(y1_max, volume);

                dates[i] = [i, date];
                m_prices[i] = [date, price, `${volume}`];
                m_volumes[i] = [date, volume, `${price}`];
            }

            y_max = y_max + (y_max * 0.1);
            y1_max = ~~(y1_max + (y1_max * 0.1));

            // console.log(randomPrices);

            g_pse_custom_graph = $J.jqplot('test-graph', [m_prices, m_volumes], {
                axes: {
                    xaxis: {
                        renderer: $J.jqplot.DateAxisRenderer,
                        tickOptions: {
                            formatString: '%b %#d<br>%Y<span class="priceHistoryTime"> %#I%p<span>'
                        },
                        pad: 1
                    },
                    yaxis: {
                        pad: 1.1,
                        tickOptions: {
                            formatString: yaxis_format,
                            labelPosition: 'start',
                            showMark: false
                        },
                        numberTicks: 7,
                        min: y_min,
                        max: y_max
                    },
                    y2axis: {
                        pad: 1.1,
                        tickOptions: {
                            formatString: '%0.0f',
                            labelPosition: 'start',
                            showMark: false
                        },
                        numberTicks: 7,
                        min: y1_min,
                        max: y1_max
                    }
                },
                grid: {
                    gridLineColor: '#1b2939',
                    borderColor: '#1b2939',
                    background: '#101822'
                },
                gridPadding: {
                    left: 45,
                    right:45,
                    top:25
                },
                axesDefaults: {
                    showTickMarks: false
                },
                cursor: {
                    show: true,
                    showTooltip: false,
                    zoom:true,
                    constrainZoomTo: 'x'
                },
                highlighter: {
                    show: true,
                    lineWidthAdjust: 2.5,
                    sizeAdjust: 5,
                    showTooltip: true,
                    tooltipLocation: 'n',
                    tooltipOffset: 20,
                    fadeTooltip: true,
                    tooltipAxes: 'xy',
                    yvalues: 2
                },
                series: [
                    {
                        yaxis: 'yaxis',
                        lineWidth: 3,
                        markerOptions: {
                            show: false,
                            style: 'circle'
                        },
                        highlighter: {
                            formatString: '%s<br>%s<br>%s sold'
                        }
                    },
                    {
                        yaxis: 'y2axis',
                        lineWidth: 3,
                        markerOptions: {
                            show: false,
                            style: 'circle'
                        },
                        highlighter: {
                            formatString: `%s<br>%s sold @ ${yaxis_format}`
                        }
                    }
                ],
                seriesColors: [
                    "#688f3e",
                    "#6b8fc3"
                ]
            });

        }

        // find line1 data
        let line1 = '';
        let scripts = document.querySelectorAll('body script');

        for (let i = 0, l = scripts.length; i < l; i ++) {
            line1 = (/var line1=.*/g.exec(scripts.item(i).innerHTML) ?? [undefined])[0];

            if (line1) break;
        }

        let pricehistory = document.getElementById('pricehistory');

        // make sure we can graph something
        if (line1 && pricehistory) {
            pricehistory.innerHTML = '';

            InjectionServiceLib.injectCode(`
var g_pse_custom_graph = null;
(function() {
${g_pse_render_custom_graph.toString()}
${drawCustomPlot.toString()}
${line1}
g_pse_render_custom_graph(line1);
drawCustomPlot(line1);
})();`, 'body');
        }
    }

}

setTimeout(() => Listings.init(), 150);
