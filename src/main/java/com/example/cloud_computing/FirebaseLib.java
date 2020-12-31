package com.example.cloud_computing;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.context.annotation.Lazy;
import org.springframework.web.bind.annotation.RestController;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Optional;

@Lazy(false)
@RestController
public class FirebaseLib {

	static FirebaseOptions options = null;

	public FirebaseLib() throws IOException {
		//TODO 	Questa chiamata a volte fallisce e crea il fetch error
		options =
				new FirebaseOptions.Builder()
						.setCredentials(ServiceAccountCredentials.getApplicationDefault())
						.setDatabaseUrl("XXX")
						.build();
		FirebaseApp.initializeApp(options);
		System.out.println(FirebaseApp.getInstance());
		System.out.println(ServiceAccountCredentials.getApplicationDefault());
	}


	public static String getUID(String idToken) throws FirebaseAuthException {
		FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
		String uid = decodedToken.getUid();
		return uid;
	}

	public static Optional<String> firebase_verifyToken_getUID(String idToken) throws Exception {
		try {
			Optional<FirebaseToken> token = decodeToken(idToken);
			if (token.isEmpty()) {
				System.out.println("FirebaseLib: firebase_verifyToken_getUID: token is empty");
				throw new Exception("token error");
			}

			return Optional.of(token.get().getUid());
		} catch (Exception e) {
			System.out.println("FirebaseLib: firebase_verifyToken_getUID: " + e.toString());
			return Optional.empty();
		}
	}


	public static int verifyToken(String idToken) throws Exception {
		// Initialize Firebase SDK Admin

		try {
			// Verify the ID token while checking if the token is revoked by passing checkRevoked
			// as true.
			// boolean checkRevoked = true;
			// FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken,
			// checkRevoked);
			// Token is valid and not revoked.
			if (decodeToken(idToken).isEmpty()) {
				throw new Exception("token error");
			}
			// String uid = decodedToken.getUid();
			return 0;
		} catch (FirebaseAuthException e) {
			System.out.println("FirebaseLib: verifyToken: " + e.toString());
			if (e.getErrorCode().equals("id-token-revoked")) {
				// Token has been revoked. Inform the user to re-authenticate or signOut() the user.
				return 1;
			} else {
				// Token is invalid.
				return 2;
			}
		}
	}

	synchronized private static Optional<FirebaseToken> decodeToken(String idToken) {

		FirebaseApp instance = null;
		try {
			instance = FirebaseApp.getInstance();
			System.out.println("FirebaseLib: decodeToken: FirebaseApp name: " + instance.getName());

	        /*if (FirebaseApp.getApps().isEmpty())
                FirebaseApp.initializeApp(options);*/
			/// FirebaseApp.initializeApp(options, UUID.randomUUID().toString());
		} catch (Exception e) {
			System.out.println("ERROR: FirebaseLib: decodeToken: " + e.toString());
		}

		if (instance == null)
			FirebaseApp.initializeApp(options);

		boolean checkRevoked = true;
		try {
			FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken, checkRevoked);
			return Optional.of(decodedToken);
		} catch (FirebaseAuthException e) {
			System.out.println("FirebaseLib: decodeToken: " + idToken + "; " + e.toString());

			return Optional.empty();
		}
	}

}