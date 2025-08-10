import React, { useState } from "react";

const GeneralContext = React.createContext({
  openBuyWindow: (uid) => {},
  closeBuyWindow: () => {},
  buyWindowOpen: false,
  buySymbol: null,

  
  openSellWindow: (uid) => {},
  closeSellWindow: () => {},
  sellWindowOpen: false,
  sellSymbol: null,
});

export const GeneralContextProvider = (props) => {
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [buySymbol, setBuySymbol] = useState(null);

  const [isSellWindowOpen, setIsSellWindowOpen] = useState(false);
  const [sellSymbol, setSellSymbol] = useState(null);

  const handleOpenBuyWindow = (uid) => {
    setBuySymbol(uid);
    setIsBuyWindowOpen(true);
  };

  const handleCloseBuyWindow = () => {
    setIsBuyWindowOpen(false);
    setBuySymbol(null);
  };

  const handleOpenSellWindow = (uid) => {
    setSellSymbol(uid);
    setIsSellWindowOpen(true);
  };

  const handleCloseSellWindow = () => {
    setIsSellWindowOpen(false);
    setSellSymbol(null);
  };

  return (
    <GeneralContext.Provider
      value={{
        openBuyWindow: handleOpenBuyWindow,
        closeBuyWindow: handleCloseBuyWindow,
        buyWindowOpen: isBuyWindowOpen,
        buySymbol: buySymbol,
        
        openSellWindow: handleOpenSellWindow,
        closeSellWindow: handleCloseSellWindow,
        sellWindowOpen: isSellWindowOpen,
        sellSymbol: sellSymbol,
      }}
    >
      {props.children}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;
