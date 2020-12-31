package com.example.cloud_computing;


import com.google.api.gax.paging.Page;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Storage;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.StreamSupport;


@RestController
public class DeleteFileController extends FileController {

	public DeleteFileController() throws IOException {
	}


	public static void deleteAllContentDir(String filename) {
		Page<Blob> blobs =
				storage.list(
						BUCKET_NAME,
						Storage.BlobListOption.fields(),
						Storage.BlobListOption.prefix(filename));
		// iterate over all file with string matching in cloud storage
		for (Blob blob : blobs.iterateAll()) {
			String filenameInDirectory = blob.getName();
			storage.delete(BlobId.of(BUCKET_NAME, filenameInDirectory));
		}
	}


	@PostMapping(value = "/file/filesystem/delete")
	public static HashMap<String, String> deleteFileController(
			@RequestBody String JsonRequest, @RequestHeader("Authorization") String authorization)
			throws Exception {


		Optional<String> uidOptional = FirebaseLib.firebase_verifyToken_getUID(authorization);
		if (uidOptional.isEmpty()) {
			System.out.println("deleteFileController: uploadFiles: error in uid");
			throw new Exception("Error in uid");
		}
		final String prefix = uidOptional.get();

		JSONObject jsonOBJ = null;
		try {
			jsonOBJ = new JSONObject(JsonRequest);
		} catch (JSONException e) {
			e.printStackTrace();
			return Utilities.sendError("Error in request");
		}
		String filename = prefix + jsonOBJ.get("filename").toString();
		filename = filename.replace("//", "/");
		System.out.println(filename);
		if (Utilities.isDir(filename)) { // if is a directory we remove the directory and all files
			deleteAllContentDir(filename);
			return Utilities.sendSuccess();
		}
		BlobId blobId = BlobId.of(BUCKET_NAME, filename);
		boolean deleted = storage.delete(blobId);
		int lastSlash = filename.lastIndexOf("/");
		String directoryPath = filename.substring(0, lastSlash);

		if (deleted) {
			System.out.println("DeleteFileController: File deleted");
		} else {
			System.out.println("DeleteFileController: File not deleted");
			return Utilities.sendError("DeleteFileController: File not found");
		}
		return Utilities.sendSuccess();
	}
}