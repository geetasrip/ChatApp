import React from "react";
import { View, Text, KeyboardAvoidingView, Firestore } from "react-native";

import { GiftedChat, Bubble } from "react-native-gifted-chat";
const firebase = require("firebase");
require("firebase/firestore");

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
      user: {
        _id: "",
        name: "",
        avatar: ""
      }
    };
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    //connecting to messages firebase
    this.referenceMessages = firebase.firestore().collection("messages");
  }

  componentDidMount() {
    this.authUnsubscribe = firebase.auth().onAuthStateChanged(user => {
      if (!user) {
        firebase.auth().signInAnonymously();
      }
      this.setState({
        uid: user.uid,
        messages: [],
        user: {
          _id: user.uid,
          name: "test",
          avatar: "https://placeimg.com/140/140/any"
        }
      });
      this.unsubscribe = this.referenceMessages
        .orderBy("createdAt", "desc")
        .onSnapshot(this.onCollectionUpdate);
    });

    this.referenceMessageUser = firebase
      .firestore()
      .collection("message")
      .where("uid", "==", this.state.uid);
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
      }
    );
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
        }
      });
    });
    this.setState({
      messages
    });
  };
  // Add messages to database
  addMessage() {
    const message = this.state.messages[0];
    console.log("message", message);
    console.log("this.referenceMessages", this.referenceMessages);
    // add a new messages to the collection
    this.referenceMessages.add({
      _id: message._id,
      text: message.text || "",
      createdAt: message.createdAt,
      user: this.state.user
    });
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

  render() {
    //entered name state from Start screen gets displayed in status bar at the top of the app
    let name = this.props.route.params.name;
    this.props.navigation.setOptions({ title: name });

    const { bgColor } = this.props.route.params;

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: bgColor
        }}
      >
        <GiftedChat
          renderBubble={this.renderBubble.bind(this)}
          messages={this.state.messages}
          onSend={messages => this.onSend(messages)}
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
    );
  }
}
