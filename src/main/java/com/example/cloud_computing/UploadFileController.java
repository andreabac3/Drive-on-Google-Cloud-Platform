package com.example.cloud_computing;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;

import javax.activation.MimetypesFileTypeMap;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Objects;
import java.util.Optional;

import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class UploadFileController extends FileController {


	public UploadFileController() {
	}

	@PostMapping("/banner/uploadFiles")
	public HashMap<String, String> uploadFiles(
			@RequestParam("file") ArrayList<MultipartFile> files, @RequestParam("extradata") String extradata)
			throws Exception {
		String prefix = "";
		String authorization = "";


		try {
			JSONObject jsonOBJ = new JSONObject(extradata);
			prefix = jsonOBJ.get("prefix").toString();
			authorization = jsonOBJ.get("Authorization").toString();
		} catch (Exception e) {
			return Utilities.sendError("Error in parsing request");
		}

		Optional<String> uidOptional = FirebaseLib.firebase_verifyToken_getUID(authorization);
		if (uidOptional.isEmpty()) {
			System.out.println("UploadFileController: uploadFiles: error in uid");
			throw new Exception("Error in uid");
		}
		final String uuid = uidOptional.get();
		System.out.println("UUID UPLOAD " +  uuid);


		String dest = uuid + prefix;

		for (MultipartFile f : files) {
			String filename = f.getOriginalFilename();
			try {
				System.out.println("Uploading: " + dest + filename);
				uploadToGCPNoTmp(f, filename, dest);
			} catch (Exception e) {
				System.out.println("Uploading error for: " + dest + filename);
				return Utilities.sendError(
						"Error for the following files: " + filename);
			}
		}
		return Utilities.sendSuccess();
	}


	synchronized private void uploadToGCPNoTmp(MultipartFile file, String realName, String dest) throws Exception {
		/// File file = new File(source);
		MimetypesFileTypeMap fileTypeMap = new MimetypesFileTypeMap();
		String mimeType = fileTypeMap.getContentType(realName);
		// the inputstream is closed by default, so we don't need to close it here
		BlobId blobId = BlobId.of(BUCKET_NAME, dest + realName);

		BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(mimeType).build();
		Blob blob = storage.create(blobInfo, file.getBytes());
	}

	@PostMapping("/file/filesystem/mkdir")
	public HashMap<String, String> newFolder(@RequestBody String request, @RequestHeader("Authorization") String authorization) throws Exception {


		Optional<String> uidOptional = FirebaseLib.firebase_verifyToken_getUID(authorization);
		if (uidOptional.isEmpty()) {
			System.out.println("UploadFileController: uploadFiles: error in uid");
			throw new Exception("Error in uid");
		}
		String uid = uidOptional.get();
		JSONObject jsonOBJ = new JSONObject(request);
		String pathFilename = jsonOBJ.get("pathFilename").toString();
		System.out.println(pathFilename);
		String directoryName = uid + pathFilename + "/";
		directoryName = directoryName.replace("//", "/");
		try {
			mkdirGCP(directoryName);
		} catch (Exception e) {
			return Utilities.sendError("error creating folder");
		}
		return Utilities.sendSuccess();

	}

	public static void mkdirGCP(final String namefolder) throws Exception {
		System.out.println("mkdir: " + namefolder);
		byte[] content = new byte[0];
		try {
			BlobId blobId = BlobId.of(BUCKET_NAME, namefolder);
			BlobInfo blobInfo =
					BlobInfo.newBuilder(blobId)
							.setContentType("application/x-www-form-urlencoded;charset=UTF-8")
							.build();
			storage.create(blobInfo, content);
		} catch (Exception e) {
			throw new Exception("Error in mkdir");
		}
	}


}