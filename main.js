const yQuery = require('./framework/server/lib/YQuery.js').YQuery;
const utils = require('./utils.js');

Object.assign(exports, require("./index.js"));

/**
 * example of yQuery
 *
 * @param {YSession} session session
 * @param {string} conn connection name
 * @return {Promise<object>} result of find
 */
async function getInvoices(session, conn) {
    return utils.dbFind(session, "user", conn, yQuery.From(`invoicing.invoice`).Select().Take(20).Execute());
}


/**
 * example of service function call
 *
 * @param {serverRequestDescription} serv request
 * @param {YSession} session session
 * @param {string} invoiceId invoice ID
 * @return {Promise<object>} result of the invoicing/total/total function
 */
async function getTotals(serv, session, invoiceId) {
    return (await utils.callFunction(serv, session, "user", {
        module: "invoicing",
        command: "total",
        args: {invoiceID: invoiceId}
    })).data;
}


/**
 * example of external API call
 *
 * @param {serverRequestDescription} serv request
 * @param {YSession} session session
 * @param {string} domain domain
 * @param {string} dbId database
 * @return {Promise<responseLocal>} user info json
 */
async function getUserInfo(serv, session, domain, dbId) {
    const role = await utils.getRoleByName(session, "user");
    try {
        return (await fetch(
            "https://quipu.auth0.com/userinfo", // external API endpoint
            {
                serviceProvider: {
                    name: "test-partner",  // service name
                    domain: domain,
                    dbId: dbId
                }
            },
            session,
            role,
            serv
        )).json();
    } catch (error) {
        if (error.idp) {
            error.loginPrompt = utils.defaultLoginPrompt(serv, session, role, error.idp, "Quipu Inc");
        }
        throw error;
    }

}

// overwrite default webView
exports.webView = async function (
    serv,
    serviceRole,
    serviceSession,
    domain,
    dbId,
    target,
    viewports,
    subscriptionState,
    context
) {
    let invoices = {},
        total = {},
        userInfo = {};
    const session = await utils.getSession(context.sessionId);
    if (session) {
        const conn = `wv${dbId}`;
        if (!session.connection(conn)) {
            await session.dbserver.connect(conn, dbId);
        }

        try {
            [invoices, total, userInfo] = await Promise.all([
                getInvoices(session, conn),
                getTotals(serv, session, "0ae4ca94-463d-471f-9ab1-f907f5d1ba59"), // example invoiceId
                getUserInfo(serv, session, domain, dbId)
            ]);
        } catch (e) {
            if (e.loginPrompt) {
                return {html: {default: e.loginPrompt}}
            }
            throw e;
        }
    }

    return {
        html: viewports.reduce((html, dimension) => {
            html[dimension] = `<html>
<body>
    <h1>Partner Name</h1>
    <div>Size: ${dimension}</div>
    <ul>
        <li>${domain}</li>
        <li>${dbId}</li>
        <li>${target}</li>
        <li>${subscriptionState}</li>
        <li>${JSON.stringify(context)}</li>
        <li>${JSON.stringify(invoices)}</li>
        <li>${JSON.stringify(total)}</li>
        <li>${JSON.stringify(userInfo)}</li>
    </ul>
</body>
</html>`;
            return html;
        }, {})
    };
};
