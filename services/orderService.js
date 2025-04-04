const axios = require("axios");
const { API_URL, API_KEY } = require("../config/config");

const ORDERS_API_URL = `${API_URL}/orders/orders`;
const SEARCH_API_URL = `${API_URL}/orders/orders/search`;

async function fetchOrderById(orderId) {
  try {
    const response = await axios.get(ORDERS_API_URL, {
      headers: {
        "X-API-KEY": API_KEY,
        accept: "application/json",
        "content-type": "application/json",
      },
      params: { ordersIds: orderId },
    });

    if (
      !response.data ||
      !response.data.Results ||
      response.data.Results.length === 0
    ) {
      return { error: `No order found with ID: ${orderId}` };
    }

    const order = response.data.Results[0];
    const orderWorth =
      order.orderDetails.payments.orderCurrency.orderProductsCost +
      order.orderDetails.payments.orderCurrency.orderDeliveryCost;

    const orderData = {
      orderID: order.orderId,
      products: [],
      orderWorth,
    };

    if (
      !order.orderDetails.productsResults ||
      !Array.isArray(order.orderDetails.productsResults)
    ) {
      return { error: `No products found for order ID: ${orderId}` };
    }

    order.orderDetails.productsResults.forEach((product) => {
      orderData.products.push({
        productID: product.productId,
        quantity: product.productQuantity,
      });
    });

    return orderData;
  } catch (error) {
    console.error(
      ` Error fetching order details for ID: ${orderId}`,
      error.message
    );
    return { error: error.message };
  }
}

async function fetchOrderIdList(dateConfirmedFrom, dateConfirmedTo) {
  const requestData = {
    params: {
      ordersRange: { dateConfirmedFrom, dateConfirmedTo },
      resultsPage: 0,
      resultsLimit: 100,
    },
  };

  try {
    const response = await axios.post(SEARCH_API_URL, requestData, {
      headers: {
        "X-API-KEY": API_KEY,
        accept: "application/json",
        "content-type": "application/json",
      },
    });

    if (!response.data || !response.data.Results) {
      return { error: "No order data in API response." };
    }

    const orderIDs = response.data.Results.map((order) => order.orderId);
    return { orderIDs };
  } catch (error) {
    console.error(" Error fetching order IDs:", error.message);
    return { error: error.message };
  }
}

async function fetchOrdersWithDetails(
  dateConfirmedFrom,
  dateConfirmedTo,
  minWorth,
  maxWorth
) {
  const { orderIDs, error } = await fetchOrderIdList(
    dateConfirmedFrom,
    dateConfirmedTo
  );

  if (error) {
    return { error };
  }

  if (!orderIDs || orderIDs.length === 0) {
    return { error: "No orders found for the given date range." };
  }

  console.log(`Fetching details for ${orderIDs.length} orders...`);

  const orderDetailsPromises = orderIDs.map((orderId) =>
    fetchOrderById(orderId)
  );
  const ordersData = await Promise.all(orderDetailsPromises);

  const filteredOrders = ordersData.filter((order) => {
    const orderWorth = order.orderWorth || 0;
    let matchesMinWorth = true;
    let matchesMaxWorth = true;

    if (minWorth) {
      matchesMinWorth = orderWorth >= parseFloat(minWorth);
    }

    if (maxWorth) {
      matchesMaxWorth = orderWorth <= parseFloat(maxWorth);
    }

    return matchesMinWorth && matchesMaxWorth;
  });

  return { orders: filteredOrders };
}

module.exports = { fetchOrderById, fetchOrderIdList, fetchOrdersWithDetails };
