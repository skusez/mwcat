import Head from 'next/head'
import Image from 'next/image'
import styles from '../../styles/Home.module.scss'
import { Text } from '@chakra-ui/react';
import React, {useRef,  useState, useEffect } from 'react';
import { SocialIcon } from 'react-social-icons';
import { Fade } from "react-awesome-reveal";
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import ReactTooltip from 'react-tooltip';
import "swiper/css/effect-cards"
import SwiperCore, {
    EffectCards
  } from 'swiper';
  SwiperCore.use([EffectCards]);
import Countdown from 'react-countdown';
import ContractData from '../../config/Contract.json';
const Web3 = require('web3');
import detectEthereumProvider from '@metamask/detect-provider'

export default function Home() {
  const [menu, setMenu] = useState(true)
  const [blur, setBlur] = useState(false)
  const [tab, setTab] = useState(0)
  const [rightOpen, setRightOpen] = useState(false)
  const [wallet, setWallet] = useState('')
  const n = 15;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [heroIndex, setHeroIndex] = useState(1);
  const [mintAmount, setMintAmount] = useState(1)


  //  const _chainIdToCompare = 1; //Ethereum
   const _chainIdToCompare = 1; //Rinkeby
  const [traits, setTraits] = useState(0)
  const [userAddress, setUserAddress] = useState('CONNECT');
  const [isLoading, setIsLoading] = useState(false);

  const [remainingNFTs, setRemainingNFTs] = useState(0);

  useEffect(async () => {
    loadIndependentData();
  }, []);

  const loadIndependentData = async() => {
    var currentProvider = new Web3.providers.HttpProvider(`https://${_chainIdToCompare == 1 ? 'mainnet' : 'rinkeby'}.infura.io/v3/be634454ce5d4bf5b7f279daf860a825`);
    const web3 = new Web3(currentProvider);
    const contract = new web3.eth.Contract(ContractData.abi, ContractData.address);


      const maxSupply = 1500;
      const totalSupply = await contract.methods.totalSupply().call();
      setRemainingNFTs(maxSupply - totalSupply);
  }
  const mintEnabled = true;
  const payable = (0.06 * mintAmount).toFixed(2);
  // Renderer callback with condition
  const renderer = ({ days, hours, minutes, seconds, completed }) => {
    if (mintEnabled == false) { return ('') }
    else if (completed) {
      // Render a completed state
      return <div className={styles.main_mint_box}>
      <h1>EXCLUSIVE ACCESS</h1>
        <p className={styles.main_mint_p}>{remainingNFTs} Moonwalkers Remaining!
        <br/>Mint 5 & Get Airdropped 0.06 ETH<br/>
        <b> {payable} ether</b>
        </p>
          <div>
            <p className={styles.main_mint_s} onClick={() => { 
              setMintAmount(mintAmount == 10 ? 10 : mintAmount+1) ;

            }}>+</p>
            <input className={styles.main_mint_input} type="text" value={`${mintAmount}`}/>
            <p className={styles.main_mint_s} onClick={() => { 
              setMintAmount(mintAmount == 1 ? 1 : mintAmount-1) ;

            }}>-</p>
          </div>
          <button  className={styles.mint_button} onClick={()=>mint(mintAmount)}> Mint {mintAmount} Moonwalker!</button>
        </div>;
    } else {
      // Render a countdown
      return <p className={styles.cd}>Time to launch: {days} days {hours} hs {minutes} min {seconds} sec</p>;
    }
  };

    const requestAccountMetamask = async() => {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if(accounts.length > 0) {
        setUserAddress(accounts[0]);

        const chainId = await ethereum.request({ method: 'eth_chainId' });
        handleChainChanged(chainId);

        ethereum.on('chainChanged', handleChainChanged);

        function handleChainChanged(_chainId) {
          if(_chainId != _chainIdToCompare) {
            window.location.reload();
          }
        }

        ethereum.on('accountsChanged', handleAccountsChanged);

        async function handleAccountsChanged(accounts) {
          if (accounts.length === 0) {
            setUserAddress('');
            
            // loadDataAfterAccountDetected();
          } else if (accounts[0] !== userAddress) {
            const chainId = await ethereum.request({ method: 'eth_chainId' });
            setUserAddress(chainId == _chainIdToCompare ? accounts[0] : 'CONNECT');
            
            
          }
        }
      }
    }

  const connectMetamaskPressed = async () => {
    try { 
      await window.ethereum.enable();
      requestAccountMetamask();
   } catch(e) {
      // User has denied account access to DApp...
   }
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x'+_chainIdToCompare }],
      });
      requestAccountMetamask();
    } catch (error) {
      
      // This error code indicates that the chain has not been added to MetaMask.
      if (error.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: '0x'+_chainIdToCompare, rpcUrl: 'https://...' /* ... */ }],
          });
          requestAccountMetamask();
        } catch (addError) {
        }
      }
    }
  }

  const mint = async(mintValue) => {
    if(userAddress == 'CONNECT') {
      return alert('Please Connect Your Wallet First (Top Of Page)');
    }
    
    if(mintValue == 0) { return; }
    setIsLoading(true);
    const provider = await detectEthereumProvider()
  
    if (provider && userAddress!='CONNECT') {
      const web3 = new Web3(provider);
      const contract = new web3.eth.Contract(ContractData.abi, ContractData.address);

      const _priceWei = await contract.methods.getCurrentPrice().call();
      
      try{
        var block = await web3.eth.getBlock("latest");
      var gasLimit = block.gasLimit/block.transactions.length;
      const gasPrice = await contract.methods.mint(
        mintValue
      ).estimateGas({from: userAddress, value: (mintValue*_priceWei)});

      await contract.methods.mint(
        mintValue
      ).send({
        from: userAddress,
        value: (mintValue*_priceWei),
        gas: gasPrice,
        gasLimit: gasLimit
      });
      alert('Minted successfuly!');
      setIsLoading(false);
      window.location.reload();
    }catch(e){
      alert('An error has happened, connect your wallet with enough funds')
    }
    }
  }

  const sleep = async( ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const clickHandle = () => {
    document.location.href = 'https://moonwalker.us20.list-manage.com/subscribe/post?u=a558426c091616f6d1b9c78a1&amp;id=d2ebdeb98f';
  }
  
  const galleryCount = async (thisHI) => {
    const _ = setTimeout(() => {
    
          setHeroIndex(thisHI + 1)

          galleryCount(thisHI == 7 ? 1 : thisHI + 1)
      }, 200);
    }

    useEffect(async()=>{
      galleryCount(1);
  }, [])



  return (<div className={styles.page}>

      <Head>
        <title>MoonwalkerFM</title>
        <meta name="description" content="MoonWalkerFM - The First NFT Music Label!" />
        <link rel="icon" href="/demo4.jpg" />
      </Head>
      <nav className={styles.navbar}>
        <SocialIcon url="http://discord.gg/MoonwalkerFM" fgColor="#fff" style={{ height: 75, width: 75 }} />
        {' '}
        <SocialIcon url="https://twitter.com/MoonwalkerFM" fgColor="#fff" style={{ height: 75, width: 75 }} />
        <button className={styles.connect_button} onClick={ () => {
            connectMetamaskPressed();
          }}>{userAddress=='CONNECT' ? 'Connect':`${userAddress.substring(0,3)}...${userAddress.substr(-3)}`}</button>
      </nav>
      <img className={styles.benefit} src='/camsecret.png'/>
        <div className={styles.main_mint}>
          <h1>EXCLUSIVE ACCESS</h1>
          <p className={styles.main_mint_p}>You've been selected<br/>Only {remainingNFTs} Gen-0 NFT's Left <br/><b>each cost</b> 0.06 ETH</p>
          
            <Countdown date={1634645247000} renderer={renderer}/>
        </div>
        <div className={styles.about}>
          <br/>
          <h2><b>MoonwalkerFM Intro</b></h2>
          <p><br/>
          <b>MoonwalkerFM</b> is the first NFT based record label of its kind offering passive rewards to holders with a unique seasonal rollout, delivering <b>high quality 1:1 Lo-Fi songs</b> from established & up & coming artists.
          We drop music in seasons of 50 tracks.</p>
          <h3>Our first season launched January 7th, 2022.</h3>
          <p> 100 Holders get associated with the 50 songs. This can be identified on our <Text decoration={'underline'} cursor={'pointer'} onClick={() => window.open('https://dapp.moonwalker.fm')}>dapp.</Text>
          The holders of these NFTs can <b>claim rewards quarterly</b>, this comes in the form of NFTs and ETH.
          But most importantly, it is a platform for artists to shine & get the type of deal they deserve.<br/><br/>Our background is in the music industry.
          <br/><br/></p>
          <h3>We will become the Lo-Fi station of the Metaverse.</h3>
          <br/><br/>
        </div>
        
        <div className={styles.main_gallery}>
          <img src={`/s${1}.png`}/>
          <img src={`/s${2}.png`}/>
          <img src={`/s${3}.png`}/>
          <img src={`/s${4}.png`}/>
          <img src={`/s${5}.png`}/>
          <img src={`/s${6}.png`}/>
        </div>
    </div>
  )
}
