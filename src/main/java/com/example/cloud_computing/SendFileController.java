package com.example.cloud_computing;


import com.google.api.gax.paging.Page;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;
import org.json.JSONObject;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.util.*;
import java.util.concurrent.TimeUnit;


@RestController
class SendFileController extends FileController {


	public SendFileController() {
		super();
	}

	@Cacheable("listening")
	@PostMapping(
			value = "/file/filesystem",
			produces = "application/json",
			consumes = "application/json")
	public HashMap<String, ArrayList<String>> getFileCampaign(
			@RequestBody String request, @RequestHeader("Authorization") String authorization)
			throws Exception {

		System.out.println(authorization);
		Optional<String> uidOptional = FirebaseLib.firebase_verifyToken_getUID(authorization);

		if (uidOptional.isEmpty()) {
			System.out.println("UploadFileController: uploadFiles: error in uid");
			throw new Exception("Error in uid");
		}

		String uuid = uidOptional.get();

		// String uuid = "2YAGLBHvIigVUXO7OhBsDe1wd0t2";


		final String rootPath = uuid;

		JSONObject jsonOBJ = new JSONObject(request);
		String prefix = jsonOBJ.get("prefix").toString();

		if (prefix == null) {
			throw new Exception("prefix is null");
		} else {
			if (prefix.length() == 0) {
				throw new Exception("prefix length is equal 0");
			}
		}

		prefix = (rootPath + prefix).replace("//", "/");

		System.out.println(prefix);

		Page<Blob> blobs =
				storage.list(
						BUCKET_NAME, Storage.BlobListOption.fields(), Storage.BlobListOption.prefix(prefix));
		ArrayList<String> fileLinks = new ArrayList<>();
		ArrayList<String> fileStructure = new ArrayList<>();
		// iterate over all file with string matching in cloud storage
		for (Blob blob : blobs.iterateAll()) {
			String fileName = blob.getName();

			if (Utilities.isDir(
					fileName)) { // if file is a directory, we can't require a link for a folder.

				fileLinks.add(""); // we can remove that
				fileStructure.add(fileName);
				continue;
			}
			fileStructure.add(fileName);
			// require a url to file in cloud storage with expiration date.
			try {
				URL signedUrl =
						storage.signUrl(BlobInfo.newBuilder(BUCKET_NAME, fileName).build(), 365, TimeUnit.DAYS);
				fileLinks.add(signedUrl.toString());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		HashMap<String, ArrayList<String>> result = new HashMap<>();
		result.put("structure", fileStructure);
		result.put("links", fileLinks);
		return result;
	}

	@PostMapping("/file/filesystem/getZip")
	public HashMap<String, String> getZip(
			@RequestBody HashMap<String, String> request, @RequestHeader("Authorization") String authorization)
			throws Exception {
		Optional<String> uidOptional = FirebaseLib.firebase_verifyToken_getUID(authorization);
		if (uidOptional.isEmpty()) {
			System.out.println("UploadFileController: uploadFiles: error in uid");
			throw new Exception("Error in uid");
		}
		String uuid = uidOptional.get();

		// this function send a post request to a cloud functions in order to avoid publish  in frontend
		// app

		if (!request.containsKey("prefix")) {
			return Utilities.sendError("error in parsing request");
		}
		String prefix = uuid + request.get("prefix");
		System.out.println(prefix);

		final String postURL = "https://europe-west6-drive-cloud-on-gcp.cloudfunctions.net/function-1";

		HttpPost post = new HttpPost(postURL);
		List<NameValuePair> params =
				new ArrayList<
						NameValuePair>(); // params list for the post request to the google cloud function

		String zipName = UUID.randomUUID().toString(); // name of the zip

		params.add(new BasicNameValuePair("namezip", zipName + ".zip"));
		params.add(new BasicNameValuePair("prefix", prefix));

		UrlEncodedFormEntity ent = null;
		try {
			ent = new UrlEncodedFormEntity(params, "UTF-8");
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}
		post.setEntity(ent);

		HttpClient client = new DefaultHttpClient();
		HttpResponse responsePOST = null;
		try {
			responsePOST = client.execute(post);
		} catch (IOException e) {
			e.printStackTrace();
		}

		BufferedReader reader = null;
		try {
			reader =
					new BufferedReader(new InputStreamReader(responsePOST.getEntity().getContent()), 2048);
		} catch (IOException e) {
			e.printStackTrace();
		}
		String line = "null";
		String getResponseString = "";
		if (responsePOST != null) {
			StringBuilder sb = new StringBuilder();
			while (true) {
				try {
					if (!((line = reader.readLine()) != null)) break;
				} catch (IOException e) {
					e.printStackTrace();
				}
				System.out.println(" ANSWER : " + line);
				sb.append(line);
			}
			getResponseString = sb.toString();
			// use server output getResponseString as string value.
		}
		getResponseString = new JSONObject(getResponseString).get("body").toString();
		HashMap<String, String> result = Utilities.sendSuccess();
		result.put("Result", getResponseString);
		return result;
	}
}
