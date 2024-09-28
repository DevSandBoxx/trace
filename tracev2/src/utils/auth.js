import { auth } from '../../firebase'
import { addUser } from './util'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, updateProfile, reauthenticateWithCredential, 
    EmailAuthProvider, sendEmailVerification } from "firebase/auth";

export let userInfo = null;

export const getUserInfo = async () =>
{
    return (userInfo ? userInfo: 'Not signed in')
}

export const reauth = async (password) => {
    let check;
    await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, password))
    .then(() => {
        check = true;
    })
    .catch((e) => {
        console.log(e);
        check = false;
    })
    return check;
}

export const signUp = async (email, password, firstName, lastName) =>
{
    let returnValue;
    console.log(email, password, firstName, lastName)
    if(!(email && password && firstName && lastName)){
        return;
    }
    await createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
        addUser(email, firstName, lastName, auth.currentUser.uid);
        updateProfile(auth.currentUser, { displayName: `${firstName} ${lastName}` }).catch((err) => console.log(err));
        verifyEmail();
        returnValue = 'successful';
    })
    .catch((error) => {
        const errorCode = error.code;
        if(errorCode == 'auth/email-already-in-use')
            returnValue = 'Email Already in Use';
        else if(errorCode == 'auth/invalid-email')
            returnValue = 'Invalid Email';
        else if(errorCode == 'auth/weak-password')
            returnValue = 'Weak Password';
        else
            returnValue = 'Invalid email/password';
    });
    return returnValue;
}

export const verifyEmail = async () => 
{
    let successful;
    await sendEmailVerification(auth.currentUser).then(() => {
        console.log("Email verification sent!");
        successful = true;
    })
    .catch((e) => {
        console.log(e);
        successful = false;
    });
    auth.signOut();
    return successful;
}

export const signIn = async (email, password) =>
{
    let signedIn;
    console.log(email + " and " + password)
    await signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      if(!userCredential.user.emailVerified) {
        signedIn = 'not verified';
      }
      else {
        const user = userCredential.user;
        userInfo = user;
        signedIn = 'successful';
      }
    })
    .catch((error) => {
      const errorCode = error.code;
      alert(errorCode=='auth/invalid-email'?'Invalid Email':errorCode=='auth/wrong-password'?'Invalid Password':'Incorrect Email/Password')
      signedIn = errorCode;
    });    
    return signedIn;
}

export const signOut = async () =>
{
    auth.signOut();
}

export const updateDisplayName = async (displayName) => {
    let check;
    await updateProfile(auth.currentUser, {
        displayName
    }).then(() => {
        check = "successful";
    })
    .catch((error) => {
        console.log(error);
        check = error.code;
    });

    return check;
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        userInfo = user;
    }
});

export const onChange = onAuthStateChanged;
