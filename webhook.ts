app.post("/webhook", async (req, res) => {
  const event = get(req, ["body", "events", "0"]);
  const eventType = get(event, ["message", "type"]);
  const message = get(event, ["message", "text"]);
  const replyToken = get(event, "replyToken") as string;

  // 1. Validate input message
  if (eventType !== "text" || !isValidAddress(message)) {
    await lineClient.replyMessage(replyToken, {
      type: "text",
      text:
        "Please input valid BSC address. For example, 0x3c74c735b5863c0baf52598d8fd2d59611c8320f 🐳",
    } as any);
    return res.sendStatus(200);
  }

  // Get poolInfos and store it to fetch faster
  // const pools = await masterchef.getPoolInfos();
  
  // 2. Get positions from masterchef
  const address = message;
  const stakings = await masterchef.getStaking(pools, address);
  const positions = sortBy(
    stakings.map((stake) => getPositions(stake)),
    ["totalValue"]
  ).reverse();
  const totalValue = positions.reduce(
    (sum, position) => sum + position.totalValue,
    0
  );

  // 3. Reply with flex message template
  await lineClient.replyMessage(replyToken, {
    type: "flex",
    altText: "Pancake Staking",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          addressBar(shortenAddress(address)),
          tableHeader(),
          ...positions.map((position) => poolLine(position)),
          summary(totalValue),
        ],
      },
    },
  } as any);
  return res.sendStatus(200);
});