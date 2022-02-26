import React from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Firestore,
  AsyncStorage,
  StyleSheet
} from "react-native";
import { GiftedChat, Bubble, InputToolbar } from "react-native-gifted-chat";
const firebase = require("firebase");
require("firebase/firestore");
import NetInfo from "@react-native-community/netinfo";
import CustomActions from "./CustomActions";
import MapView from "react-native-maps";

//firebase related configs
const firebaseConfig = {
  apiKey: "AIzaSyBYmGjxnh2GzNM8yn-boithcK6Y1inudL4",
  authDomain: "chatapp-f2f46.firebaseapp.com",
  projectId: "chatapp-f2f46",
  storageBucket: "chatapp-f2f46.appspot.com",
  messagingSenderId: "925128746136",
  appId: "1:925128746136:web:98d0d67b9a13b0bf951ced"
};

export default class Chat extends React.Component {
  constructor() {
    super();
    this.state = {
      messages: [],
      uid: 0,
      isConnected: false,
      user: {
        _id: "",
        name: "",
        avatar: ""
      },
      image: null,
      location: null
    };
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    //connecting to messages firebase
    this.referenceMessages = firebase.firestore().collection("messages");
  }

  componentDidMount() {
    let name_current = this.props.route.params.name;
    // Adds the name to top of screen
    this.props.navigation.setOptions({ title: name_current });

    //Check if the user is off- or online
    NetInfo.fetch().then(connection => {
      if (connection.isConnected) {
        this.setState({ isConnected: true });
        console.log("online");

        //listen to authentication events, sign in anonymously
        this.authUnsubscribe = firebase.auth().onAuthStateChanged(user => {
          if (!user) {
            firebase.auth().signInAnonymously();
          }

          this.setState({
            uid: user.uid,
            messages: [],
            user: {
              _id: user.uid,
              name: name_current,
              avatar: "https://placeimg.com/140/140/any"
            }
          });
          // listens for updates in the collection
          this.unsubscribe = this.referenceMessages
            .orderBy("createdAt", "desc")
            .onSnapshot(this.onCollectionUpdate);
        });

        this.referenceMessageUser = firebase
          .firestore()
          .collection("message")
          .where("uid", "==", this.state.uid);
      } else {
        console.log("offline");
        this.setState({ isConnected: false });
        //retrieve chat from asyncstorage
        this.getMessages();
      }
    });
  }

  async getMessages() {
    let messages = "";
    try {
      messages = (await AsyncStorage.getItem("messages")) || [];
      this.setState({
        messages: JSON.parse(messages)
      });
    } catch (error) {
      console.log(error.message);
    }
  }
  componentWillUnmount() {
    this.authUnsubscribe();
    this.unsubscribe();
  }

  onSend(messages = []) {
    this.setState(
      previousState => ({
        messages: GiftedChat.append(previousState.messages, messages)
      }),
      () => {
        this.addMessage();
        this.saveMessages();
      }
    );
  }
  async saveMessages() {
    try {
      await AsyncStorage.setItem(
        "messages",
        JSON.stringify(this.state.messages)
      );
    } catch (error) {
      console.log(error.message);
    }
  }

  onCollectionUpdate = querySnapshot => {
    const messages = [];
    // go through each document
    querySnapshot.forEach(doc => {
      // get the QueryDocumentSnapshot's data
      var data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar
        },
        image: data.image || null,
        location: data.location || null
      });
    });
    this.setState({
      messages
    });
    this.saveMessages();
  };
  // Add messages to database
  addMessage() {
    const message = this.state.messages[0];
    // add a new messages to the collection
    this.referenceMessages.add({
      _id: message._id,
      text: message.text || "",
      createdAt: message.createdAt,
      user: this.state.user,
      image: message.image || "",
      location: message.location || null
    });
  }
  //customizes input toolbar (hide if offline)
  renderInputToolbar(props) {
    if (this.state.isConnected == false) {
    } else {
      return <InputToolbar {...props} />;
    }
  }
  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: "#000"
          }
        }}
      />
    );
  }

  renderCustomActions = props => {
    return <CustomActions {...props} />;
  };

  renderCustomView(props) {
    const { currentMessage } = props;
    if (currentMessage.location) {
      return (
        <MapView
          style={{ width: 150, height: 100, borderRadius: 13, margin: 3 }}
          region={{
            latitude: currentMessage.location.latitude,
            longitude: currentMessage.location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
          }}
        />
      );
    }
    return null;
  }

  render() {
    //entered name state from Start screen gets displayed in status bar at the top of the app
    let name_current = this.props.route.params.name;
    this.props.navigation.setOptions({ title: name_current });

    const { bgColor } = this.props.route.params;

    return (
      <View style={styles.container}>
        <View
          style={{ backgroundColor: bgColor, width: "100%", height: "100%" }}
        >
          <GiftedChat
            renderBubble={this.renderBubble.bind(this)}
            renderActions={this.renderCustomActions}
            renderCustomView={this.renderCustomView}
            messages={this.state.messages}
            onSend={messages => this.onSend(messages)}
            renderInputToolbar={this.renderInputToolbar.bind(this)}
            user={{
              _id: this.state.user._id,
              name: this.state.name,
              avatar: this.state.user.avatar
            }}
          />
          {Platform.OS === "android" ? (
            <KeyboardAvoidingView behavior="height" />
          ) : null}
        </View>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  giftedChat: {
    color: "#000"
  }
});
