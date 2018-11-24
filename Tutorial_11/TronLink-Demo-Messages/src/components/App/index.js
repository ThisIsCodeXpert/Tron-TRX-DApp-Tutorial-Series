import React from 'react';
import TronLinkGuide from 'components/TronLinkGuide';
import TronWeb from 'tronweb';
import Utils from 'utils';
import Swal from 'sweetalert2';
import Content from './Content';

import './App.scss';

const FOUNDATION_ADDRESS = 'TWiWt5SEDzaEqS6kE5gandWMNfxR2B5xzg';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
              candidates:[],
              hasVoted: false,
              loading: false,

              tronWeb: {
                  installed: false,
                  loggedIn: false
              },
            }

            this.voteCandidate = this.voteCandidate.bind(this)
    }

    async componentDidMount() {

        this.setState({loading:true})
        await new Promise(resolve => {
            const tronWebState = {
                installed: !!window.tronWeb,
                loggedIn: window.tronWeb && window.tronWeb.ready
            };

            if(tronWebState.installed) {
                this.setState({
                    tronWeb:
                    tronWebState
                });

                return resolve();
            }

            let tries = 0;

            const timer = setInterval(() => {
                if(tries >= 10) {
                    const TRONGRID_API = 'https://api.trongrid.io';

                    window.tronWeb = new TronWeb(
                        TRONGRID_API,
                        TRONGRID_API,
                        TRONGRID_API
                    );

                    this.setState({
                        tronWeb: {
                            installed: false,
                            loggedIn: false
                        }
                    });

                    clearInterval(timer);
                    return resolve();
                }

                tronWebState.installed = !!window.tronWeb;
                tronWebState.loggedIn = window.tronWeb && window.tronWeb.ready;

                if(!tronWebState.installed)
                    return tries++;

                this.setState({
                    tronWeb: tronWebState
                });

                resolve();
            }, 100);
        });

        if(!this.state.tronWeb.loggedIn) {
            // Set default address (foundation address) used for contract calls
            // Directly overwrites the address object as TronLink disabled the
            // function call
            window.tronWeb.defaultAddress = {
                hex: window.tronWeb.address.toHex(FOUNDATION_ADDRESS),
                base58: FOUNDATION_ADDRESS
            };

            window.tronWeb.on('addressChanged', () => {
                if(this.state.tronWeb.loggedIn)
                    return;

                this.setState({
                    tronWeb: {
                        installed: true,
                        loggedIn: true
                    }
                });
            });
        }
        await Utils.setTronWeb(window.tronWeb);
        this.fetchData();
        this.startEventListener();
        this.setState({loading:false})

    }

    startEventListener(){
        Utils.contract.eventVote().watch((err) => {

            if(err){
            return console.log('Failed to bind the event', err);
            }

            window.location.reload();
        });

    }

    async fetchData(){
        const CandidateCount = (await Utils.contract.candidatecount().call()).toNumber();
        console.log('CandidateCount', CandidateCount);

        for(var i=1; i<=CandidateCount; i++){

            const candidate_tmp = await Utils.contract.candidates(i).call();
            console.log('candidate_tmp', candidate_tmp);

            const candidates = [...this.state.candidates];

            candidates.push({
                            id: candidate_tmp.id.toNumber(),
                            name: candidate_tmp.name,
                            voteCount: candidate_tmp.voteCount.toNumber()
            });

            this.setState({candidates:candidates})



        }

    }

    voteCandidate(candidateId){

        Utils.contract.vote(candidateId).send({
            shouldPollResponse: true,
            callValue: 0
        }).then(res => Swal({
            title:'Vote Casted',
            type: 'success'
        })).catch(err => Swal({
            title:'Vote Failed',
            type: 'error'

        }));

        this.setState({hasVoted:true})
    }


    render() {
        if(!this.state.tronWeb.installed)
            return <TronLinkGuide />;

        if(!this.state.tronWeb.loggedIn)
            return <TronLinkGuide installed />;

        return (
              <div className='row'>
                <div className='col-lg-12 text-center' >
                  <h1>DAPP Election</h1>
                  <br/>
                  { this.state.loading
                    ? <p className='text-center'>Loading...</p>
                    : <Content
                        candidates={this.state.candidates}
                        hasVoted={this.state.hasVoted}
                        castVote={this.voteCandidate} />
                  }
                </div>
              </div>
        );
    }
}

export default App;

