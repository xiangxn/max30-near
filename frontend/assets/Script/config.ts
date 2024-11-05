const contractPerNetwork = {
    testnet: "max30.necklace-dev.testnet",
};

var cfg = {

    colors: ['#FFB8B8',
        '#FFB8B8', '#8CFFCC', '#C88CFF', '#E0FF8C', '#8C94FF',
        '#FF8C8C', '#4FFDB0', '#C34FFF', '#7AFF75', '#B8BDFF',
        '#FF7979', '#B1FF8C', '#F84CFE', '#FFED00', '#6A74FF',
        '#FF3939', '#FFFD8C', '#9A00FF', '#D5FF49', '#3B49FF',
        '#FFA478', '#B8F963', '#FF91E9', '#4CFD44', '#0012FF',
        '#F78D34', '#22F4F4', '#FF22B0', '#FFC300', '#4BA6FF'
    ],
    bets: [0.1, 0.5, 1, 5, 10, 50],
    paySymbol: "NEAR",
    symbol: "NEAR",
    precision: 4,
    gameContract: "",
    NetworkId: "testnet",
    status: 0
};
export default Object.assign(cfg, {
    gameContract: contractPerNetwork[cfg.NetworkId]
});