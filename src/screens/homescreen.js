import React from 'react';

import { withStyles } from '@material-ui/core/styles';
import { Grid, Typography, Menu, Button, MenuItem, Link, Divider, Avatar, BottomNavigation, 
    BottomNavigationAction, Tabs, Tab } from '@material-ui/core';
import FollowingTable from '../components/followingtable';
import Okrs from '../components/okrs';
import CoPom from '../components/copom';
import Edit from '../components/dialog';
import FrontPage from '../components/frontpage';
import firebase from '../firebase';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';

import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
import GroupWorkIcon from '@material-ui/icons/GroupWork';


const dummyData = require('../components/dummyData.json');


const styles = theme => ({
    root: {
        background: '#fff',
        flexGrow: 1,
        textAlign: 'center',
        minHeight: '100vh',
        margin: '0px'
    },
    jumbo: {
        fontWeight: 600,
        cursor: 'pointer',
        color: "#333",
        padding: "20px",
        marginBottom: '20px'
    },
    dark: {
        background: '#333'
    },
    accountButton: {
        position: "absolute",
        top: "20px",
        right: "20px",
        cursor: "pointer"
    },
    stickToBottom: {
        width: '100%',
        position: 'fixed',
        bottom: 0,
        borderTop: '1px solid #eee',
        zIndex: '10',
    },
    edit: {
        maxWidth: '100%',
        borderRight: '1px solid #888',
        borderLeft: '1px solid #888',
        background: "#333",
        color: '#888',
        // boxShadow: "none",
        "&:hover": {
            color: "#fff",
            // background: '#fff'
        },
    },
    tab:{
        background: '#333',
        borderRadius: "5px"
    },
    rightpane:{
        paddingRight: "5px",
        paddingLeft: "5px"
    },
    leftpane:{
        paddingRight: "5px",
        paddingLeft: "5px"
    }
});



class HomeScreen extends React.Component {



    constructor(props) {
        super(props);
        let _isMounted = false;
        this.uiConfig = {
            signInFlow: 'popup',
            signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
            callbacks: {
                signInSuccess: () => false
            }
        }



        this.state = {
            anchorEl: null,
            mode: props.mode,
            isSignedIn: false,
            showDialog: false,
            showDialogContent: null,
            curUserOKRs: [],
            curUser: {},
            userlist: [],
            pommers: [],
            followlist: {},
            followerslist: {},
            poms: {},
            isFollowing: false,
            userRequested: new URLSearchParams(window.location.search).get('user'),
            quarter: 'Q' + (new URLSearchParams(window.location.search).get('q') || Math.ceil((new Date().getMonth() + 1) / 3)),
            year: 'Y' + (new URLSearchParams(window.location.search).get('y') || new Date().getFullYear()),
            ...dummyData
        }


        this.handleCloseDialog = this.handleCloseDialog.bind(this);
        this.handleOpenDialog = this.handleOpenDialog.bind(this);
        this.handleFollow = this.handleFollow.bind(this);
        this.signOut = this.signOut.bind(this);
        this.updateProgress = this.updateProgress.bind(this);
    }

    signOut() {
        this.setState({
            anchorEl: null,
            isSignedIn: false,
            curUserOKRs: [],
            curUser: {},
            // userlist: [],
            followlist: {},
            followerslist: {},
            poms: {},
            userRequested: null
        })

        firebase.auth().signOut();
    }

    handleFollow = (event) => {
        if (!this.state.isFollowing) {
            this.setState({ isFollowing: !this.state.isFollowing });
            // console.log(this.deployment + '/userlist/' + this.state.curUser.uid,this.state.curUser);
            const newFollowRef = firebase.database().ref(this.deployment + '/userlist/' + this.state.curUser.uid).push();
            newFollowRef.set(this.state.userRequested);
        }
        else {
            this.setState({ isFollowing: !this.state.isFollowing });

            const followID = Object.keys(this.state.followlist).filter(d => {
                // console.log(d, this.state.followlist[d]);
                return this.state.followlist[d] === this.state.userRequested
            }
            )
            firebase.database().ref(this.deployment + '/userlist/' + this.state.curUser.uid + '/' + followID).remove();

        }

    }


    componentWillUnmount() {
        this._isMounted = false;
    }

    componentDidMount() {
        this._isMounted = true;
        if (process.env.NODE_ENV !== 'production') {
            this.deployment = 'dev';
        }
        else {
            this.deployment = 'prod';
        }

        firebase.auth().onAuthStateChanged(user => {
            if (user !== null) {
                this.setState({ isSignedIn: !!user })
                if (this._isMounted) {
                    console.log(this.deployment);


                    // this is all users ref on firebase
                    const usersRef = firebase.database().ref(this.deployment + '/users')


                    const userID = user.email.split('@')[0].replace('.', '');
                    usersRef.child(user.uid).once('value', (snapshot) => {
                        if (snapshot.exists()) {
                            this.setState({ 'curUser': snapshot.val() });
                            // This user exists, so we need to get them
                            if (this.state.userRequested === null) {
                                this.setState({ 'userRequested': snapshot.val().userID })
                            }

                        }
                        else {
                            // This user does not exists, so we need to add the user to our userlist
                            const userToStore = {
                                name: user.displayName,
                                firstName: user.displayName.split(' ')[0],
                                photoURL: user.photoURL,
                                email: user.email,
                                uid: user.uid,
                                userID: userID
                            }
                            firebase.database().ref(this.deployment + '/users/' + user.uid).set(userToStore);
                            const newUserRef = firebase.database().ref(this.deployment + '/userlist/all/' + user.uid);
                            newUserRef.set(userID);
                            this.setState({ 'curUser': userToStore })
                            if (this.state.userRequested === null) {
                                this.setState({ 'curUser': snapshot.val(), 'userRequested': snapshot.val().userID })
                            }

                        }

                        // Get Current User OKRs
                        if (this.state.userRequested === null) {

                            firebase.database().ref(this.deployment + '/okrs/').child(user.uid).child(this.state.year).child(this.state.quarter).once('value', (snapshot) => {
                                if (snapshot.val() !== null) {
                                    this.setState({ 'curUserOKRs': snapshot.val() }, () => {
                                    });
                                }

                            })


                        }
                        else {
                            firebase.database().ref(this.deployment + '/userlist/all').once('value', (d) => {
                                const dd = d.val();
                                const userX = Object.keys(dd).find(key => dd[key] === this.state.userRequested);

                                if (userX !== undefined && userX !== null) {
                                    firebase.database().ref(this.deployment + '/okrs').child(userX).child(this.state.year).child(this.state.quarter).once('value', (snapshot) => {
                                        if (snapshot.val() !== null) {
                                            this.setState({ 'curUserOKRs': snapshot.val() }, () => {
                                            });
                                        }

                                    })
                                }

                            })
                        }

                        // Get All following list
                        firebase.database().ref(this.deployment + '/userlist/' + user.uid).on('value', (snapshot) => {
                            if (snapshot.val() !== null) {
                                this.setState({ followlist: snapshot.val() }, () => {
                                    // console.log('follow-list-updated!', snapshot.val());
                                });
                                if (Object.values(snapshot.val()).indexOf(this.state.userRequested) >= 0) {
                                    this.setState({ isFollowing: true });
                                }
                            }
                            else {
                                this.setState({ followlist: {} })
                            }
                        })

                        // Get all followers list
                        firebase.database().ref(this.deployment + '/userlist').once('value', (snapshot) => {
                            // console.log('alluserlist',snapshot.val());
                            let obj = snapshot.val();
                            let allUsers = obj.all;
                            let followers = {};
                            let followOpt;
                            if (obj !== null) {
                                followOpt = Object.keys(obj).filter(d => {
                                    if (d !== 'all') {
                                        let tempUserFollows = obj[d];
                                        if (Object.values(tempUserFollows).includes(this.state.curUser.userID)) {
                                            followers[d] = allUsers[d];
                                            return d;
                                        }
                                    }
                                })

                                this.setState({ followerslist: followers })



                            }
                            else {
                                this.setState({ followerslist: {} })
                            }
                        })




                    });


                    // const tempDataLoader = firebase.database().ref(this.deployment+'/okrs/temp');
                    // tempDataLoader.set(dummyData.okrList);





                }
            }
            else {
                // window.location.href='/okrs';
            }

        })

        // Get Another User OKRs (Not signed in, maybe)
        if (!this.state.isSignedIn && this.state.userRequested !== null) {
            firebase.database().ref(this.deployment + '/userlist/all').once('value', (d) => {
                const dd = d.val();
                const userX = Object.keys(dd).find(key => {
                    return dd[key] === this.state.userRequested;
                });

                if (userX !== undefined && userX !== null) {

                    firebase.database().ref(this.deployment + '/okrs').child(userX).child(this.state.year).child(this.state.quarter).once('value', (snapshot) => {
                        if (snapshot.val() !== null) {
                            this.setState({ 'curUserOKRs': snapshot.val() }, () => {
                                // console.log('user-okrs-updated!', snapshot.val(), this.state);
                            });
                        }

                    })
                }
            })

        }

        // Get all users
        firebase.database().ref(this.deployment + '/userlist/all').once('value', (snapshot) => {
            if (snapshot.val() !== null) {
                this.setState({ userlist: Object.values(snapshot.val()) }, () => {
                });
            }
        })


        // Get all pommers
        firebase.database().ref(this.deployment + '/userlist/all').once('value', (d) => {
            const dd = d.val();


            // const queryDate = new Date().toLocaleDateString().replace(/\//g, '-');
            // const queryDate = new Date().getUTCDate() + '-'+new Date().getUTCMonth() + '-' + new Date().getUTCFullYear();
            const queryDate = new Date().getDate() + '-' + new Date().getMonth() + '-' + new Date().getFullYear();

            firebase.database().ref(this.deployment + '/poms').child(queryDate)
                .once('value', (snapshot) => {
                    const pomIds = snapshot.val();
                    const pommers = [];
                    if (pomIds !== null) {

                        for (var key in pomIds) {
                            pommers.push(dd[key]);
                        }
                        this.setState({ pommers });
                    }
                })
        })




    }


    handleCloseDialog = (flag, objective, keyResults) => {
        // console.log('closed! NEW', objective, keyResults);
        const showDialogContent = this.state.showDialogContent;
        const okrItem = {
            id: objective.id,
            title: objective.title,
            description: objective.description,
            failureMode: objective.failureMode,
            category: objective.category,
            keyResults: keyResults
        }

        const newOKRList = this.state.curUserOKRs;
        if (this.state.showDialogContent === null) {
            if (flag === 'new') {
                okrItem.id = newOKRList.length;
                newOKRList.push(okrItem);
            }
        }
        else {
            if (flag === 'delete') {
                newOKRList.splice(showDialogContent, 1);
            }
            if (flag === 'old') {
                newOKRList[showDialogContent] = this.state.editOKR;
            }
            else if (flag === 'new') {

                newOKRList[showDialogContent] = okrItem;
            }
        }


        this.setState({
            ...this.state,
            showDialog: false,
            curUserOKRs: newOKRList
        });


        firebase.database().ref(this.deployment + '/okrs/' + this.state.curUser.uid + '/' + this.state.year + '/' + this.state.quarter).set({
            ...newOKRList
        });

    };

    handleOpenDialog = (showDialogContent) => {
        this.setState({ showDialog: true });
        this.setState({ showDialogContent: showDialogContent });
        this.setState({ editOKR: this.state.curUserOKRs[showDialogContent] });
        if (showDialogContent === null) {
            this.setState({ dialogContent: this.state.defaultDialogContent });
        }
        else {
            this.setState({ dialogContent: this.state.curUserOKRs[showDialogContent] });
        }
    };

    updateProgress = (k, i, j) => {
        if (this.state.curUser.userID === this.state.userRequested && this.state.isSignedIn) {
            console.log('updateprogress', k, i, j);
            let allOKRs = this.state.curUserOKRs;
            let curOKR = allOKRs[k];
            let curKR = curOKR.keyResults[i];


            let newProgress = curKR.progress.map((p, q) => {
                if (q !== j) {
                    return p;
                }
                else {
                    return (p + 1) % 4;
                }
            });

            let newKRs = curOKR.keyResults.map((p, q) => {
                if (q !== i) {
                    return p;
                }
                else {
                    return {
                        ...curKR,
                        progress: newProgress
                    };
                }
            })

            let newAllOKRs = allOKRs.map((p, q) => {
                if (q !== k) {
                    return p;
                }
                else {
                    return {
                        ...curOKR,
                        keyResults: newKRs
                    };
                }
            })

            this.setState({ curUserOKRs: newAllOKRs })

            firebase.database().ref(this.deployment + '/okrs/' + this.state.curUser.uid + '/' + this.state.year + '/' + this.state.quarter).set({
                ...newAllOKRs
            });
        }


    }

    navHandleClick = event => {
        this.setState({ anchorEl: event.currentTarget });
    };
    navHandleClose = event => {
        this.setState({ anchorEl: null });
    };

    navSignin = () => {
        window.location.href = '/?m=okrs'
        // window.history.pushState({}, null, '/?m=okrs');

    };


    render() {
        // console.log(this.state);
        const { classes, theme } = this.props;

        // console.log('fresh hell :(', this.state);
        return (

            <div className={classes.root}>
                {(this.state.isSignedIn || this.state.userRequested !== null) ?
                    (<Grid container direction="column">
                        {/* <Grid container justify="flex-end" direction="row" className={classes.dark}> */}
                        {this.state.curUser && this.state.isSignedIn ?
                            (this.state.curUser.photoURL ? <Avatar className={classes.accountButton} alt="Remy Sharp" src={this.state.curUser.photoURL} onClick={this.navHandleClick} />
                                :
                                <AccountCircleIcon aria-controls="simple-menu" aria-haspopup="true" onClick={this.navHandleClick}
                                    className={classes.accountButton} fontSize="large">

                                </AccountCircleIcon>)
                            :
                            <AccountCircleIcon aria-controls="simple-menu" aria-haspopup="true" onClick={this.navHandleClick}
                                className={classes.accountButton} fontSize="large">

                            </AccountCircleIcon>}
                        <Menu
                            id="simple-menu"
                            anchorEl={this.state.anchorEl}
                            keepMounted
                            open={Boolean(this.state.anchorEl)}
                            onClose={this.navHandleClose}
                        >
                            {!this.state.isSignedIn ? <MenuItem onClick={this.navSignin}>Login</MenuItem> :
                                <MenuItem onClick={() => {
                                    console.log('logged out!');

                                    this.setState({ isSignedIn: false }, () => {
                                        this.signOut();
                                        // window.location.href = '/okrs';
                                    });
                                }}>Logout</MenuItem>}
                        </Menu>
                        {/* </Grid> */}
                        <Grid container item direction="row">
                            <Grid item xs={false} sm={false} md={2} lg={3} xl={3}>
                            </Grid>
                            <Grid item xs={12} sm={12} md={8} lg={6} xl={6}>
                                <Typography variant="h1" className={classes.jumbo}>
                                    <Link href="/" underline="none" color="textPrimary">okru</Link>
                                    {this.deployment === 'dev' ? '-dev' : ''}
                                </Typography>
                            </Grid>
                            <Grid item xs={false} sm={false} md={2} lg={3} xl={3}>
                            </Grid>
                        </Grid>
                        <Grid container item  direction="row" justify="center" xs={12} sm={12} md={12} lg={12} xl={12} style={{ marginBottom: '50px' }}>
                            <Grid container item  xs={false} sm={false} md={1} lg={1} xl={1}></Grid>
                            <Grid container item  className={classes.leftpane} direction="column" xs={12} sm={12} md={7} lg={7} xl={7}>
                                <Tabs
                                    value={this.state.mode}
                                    onChange={(event, newValue) => {
                                        this.setState({ mode: newValue })
                                        if (newValue === 0) {
                                            window.history.pushState({}, null, '/?m=okrs');
                                            // window.location.href='/?m=okrs';
                                        }
                                        else if (newValue === 1) {
                                            window.history.pushState({}, null, '/?m=copom');
                                            // window.location.href='/?m=copom';
                                        }
                                    }}
                                    // indicatorColor="none"
                                    // textColor="none"
                                    className={classes.tab}
                                >
                                    <Tab icon={<FormatListBulletedIcon />} label="Personal OKRs" />
                                    <Tab icon={<GroupWorkIcon />} label="CoPom" />
                                </Tabs>
                                {this.state.mode ?
                                    (
                                        <CoPom user={this.state.curUser} following={Object.values(this.state.followlist)}></CoPom>
                                    ) : (
                                        <Okrs
                                            okrList={this.state.curUserOKRs}
                                            handleOpenDialog={this.handleOpenDialog}
                                            selfView={this.state.curUser.userID === this.state.userRequested}
                                            isFollowing={this.state.isFollowing}
                                            userBeingViewed={this.state.userRequested}
                                            handleFollow={this.handleFollow}
                                            isSignedIn={this.state.isSignedIn}
                                            quarter={this.state.quarter}
                                            year={this.state.year}
                                            updateProgress={this.updateProgress}></Okrs>
                                    )}
                            </Grid>
                            <Grid container item  className={classes.rightpane} direction="column" xs={12} sm={12} md={3} lg={3} xl={3}>
                                <Grid >

                                    <FollowingTable following={this.state.userlist} name="All Users" initText="No Users :(" />
                                    <FollowingTable following={this.state.pommers} name="All Pommers" initText="No Pommers Today!" />

                                </Grid>
                                {this.state.isSignedIn ?
                                    <Grid>

                                            <FollowingTable following={Object.values(this.state.followlist)} name="Following" initText="You're not following anyone!" />
                                            <FollowingTable following={Object.values(this.state.followerslist)} name="Followers" initText="You do not have any followers yet!" />

                                    </Grid>
                                    : ''}
                            </Grid>
                            <Grid container item  xs={false} sm={false} md={1} lg={1} xl={1}></Grid>

                        </Grid>
                        {/* <BottomNavigation value={this.state.mode} onChange={(event, newValue) => {
                            this.setState({ mode: newValue })
                            if (newValue === 0) {
                                window.history.pushState({}, null, '/?m=okrs');
                                // window.location.href='/?m=okrs';
                            }
                            else if (newValue === 1) {
                                window.history.pushState({}, null, '/?m=copom');
                                // window.location.href='/?m=copom';
                            }
                        }}
                            showLabels
                            className={classes.stickToBottom}
                        >
                            <BottomNavigationAction className={classes.edit} label="OKRs" icon={<FormatListBulletedIcon />} />
                            {this.state.isSignedIn ? <BottomNavigationAction className={classes.edit} label="CoPom" icon={<GroupWorkIcon />} /> : ''}
                        </BottomNavigation> */}

                        {this.state.curUser.userID === this.state.userRequested ? <Edit openDialog={this.state.showDialog} handleCloseDialog={this.handleCloseDialog} showOKR={this.state.dialogContent} /> : ''}



                    </Grid>


                    )
                    :
                    (
                        <FrontPage></FrontPage>
                    )
                }
            </div>

        )
    }
}

export default withStyles(styles)(HomeScreen);
