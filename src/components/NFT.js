import React from 'react';
import '../NFTcollections.css'
import NFTDetails from './pages/NFTDetails';
import { getCleanNFTUrl } from "./../utils/utils";
import nftStyles from "./../styles/nft.module.scss";

const NFT = ({object, fetchedData, cryptoWallets , setScreenWithData, mapping} ) => {
    const imgUrl = getCleanNFTUrl(object.imageUrl);

    return (
        <div className={nftStyles.nftCard} onClick={()=>{
            setScreenWithData("nftDetails", {object, imgUrl, mapping, cryptoWallets})
        }}>
            <div className={nftStyles.nftBackground}>
                <div className="nftImg" style={{backgroundImage: `url(${imgUrl})`}}></div>
                {/* <div className="nftImg">
                    <img src={imgUrl} alt={mapping && mapping[object.token] ? `${mapping[object.token]}` : ""}/>
                </div> */}
            </div>
            <div className="nftData">
                <strong>{object.serialNumber ? `#${object.serialNumber}` : ""}</strong>
                <p className='tokenText'>{mapping && mapping[object.token] ? `${mapping[object.token]}` : ""}</p>
            </div>
        </div>
    )
}

export default NFT;