import React from "react";
import PropTypes from "prop-types";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ImageBackground,
  Image,
  TouchableOpacity
} from "react-native";
import * as Permissions from "expo-permissions";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { connectActionSheet } from "@expo/react-native-action-sheet";
import firebase from "firebase";
import "firebase/firestore";

class CustomActions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  pickImage = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    console.log("in pickImage", status);
    if (status === "granted") {
      console.log("in pickImage granted");

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "Images"
      }).catch(error => console.log(error));

      if (!result.cancelled) {
        console.log("in callback", result);
        const imageUrl = await this.uploadImage(result.uri);
        console.log("imageUrl", imageUrl);
        this.props.onSend({ image: imageUrl });
        // this.setState({
        //   image: result.uri
        // });
      }
    }
  };

  takePhoto = async () => {
    const { status } = await Permissions.askAsync(
      Permissions.CAMERA_ROLL,
      Permissions.CAMERA
    );
    if (status === "granted") {
      let result = await ImagePicker.launchCameraAsync().catch(error =>
        console.log(error)
      );

      if (!result.cancelled) {
        const imageUrl = await this.uploadImage(result.uri);
        console.log("imageUrl", imageUrl);
        this.props.onSend({ image: imageUrl });

        // this.setState({
        //   image: result.uri
        // });
      }
    }
  };

  getLocation = async () => {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status === "granted") {
      let result = await Location.getCurrentPositionAsync({}).catch(error =>
        console.log(error)
      );

      if (result) {
        this.props.onSend({
          location: {
            longitude: result.coords.longitude,
            latitude: result.coords.latitude
          }
        });
      }
    }
  };

  //store uploaded image to firebase  as blobs
  uploadImage = async uri => {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function() {
        resolve(xhr.response);
      };
      xhr.onerror = function(e) {
        console.log(e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    const imageNameBefore = uri.split("/");
    const imageName = imageNameBefore[imageNameBefore.length - 1];

    const ref = firebase
      .storage()
      .ref()
      .child(`images/${imageName}`);

    const snapshot = await ref.put(blob);

    blob.close();

    return await snapshot.ref.getDownloadURL();
  };

  onActionPress = () => {
    const options = [
      "Choose From Library",
      "Take Picture",
      "Send Location",
      "Cancel"
    ];
    const cancelButtonIndex = options.length - 1;
    this.props.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex
      },
      async buttonIndex => {
        switch (buttonIndex) {
          case 0:
            console.log("user wants to pick an image");
            return this.pickImage();
          case 1:
            console.log("user wants to take a photo");
            return this.takePhoto();
          case 2:
            console.log("user wants to get their location");
            return this.getLocation();
        }
      }
    );
  };

  render() {
    return (
      <TouchableOpacity style={[styles.container]} onPress={this.onActionPress}>
        <View style={[styles.wrapper, this.props.wrapperStyle]}>
          <Text style={[styles.iconText, this.props.iconTextStyle]}>+</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

const ConnectedActions = connectActionSheet(CustomActions);
export default ConnectedActions;

const styles = StyleSheet.create({
  container: {
    width: 26,
    height: 26,
    marginLeft: 10,
    marginBottom: 10
  },
  wrapper: {
    borderRadius: 13,
    borderColor: "#b2b2b2",
    borderWidth: 2,
    flex: 1
  },
  iconText: {
    color: "#b2b2b2",
    fontWeight: "bold",
    fontSize: 16,
    backgroundColor: "transparent",
    textAlign: "center"
  }
});
