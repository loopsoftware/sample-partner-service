const yQuery = require('./framework/server/lib/YQuery.js').YQuery;
const utils = require('./utils.js');

Object.assign(exports, require("./index.js"));

async function getInvoices(session) {
    return utils.dbFind(session, "user", "nsC", yQuery.From("invoicing.invoice").Select().Take(20).Execute());
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
    let invoices = {};
    const session = await utils.getSession(context.sessionId);
    if (session) {
        invoices = await getInvoices(session);
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
    </ul>
</body>
</html>`;
            return html;
        }, {})
    };
};
