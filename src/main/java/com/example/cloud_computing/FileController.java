package com.example.cloud_computing;


import com.google.api.gax.paging.Page;
import com.google.auth.Credentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;

abstract class FileController {

	protected static final String BUCKET_NAME = "drive-cloud-on-gcp.appspot.com";
	protected static final String PROJECT_ID = "drive-cloud-on-gcp";
	FileInputStream authCred;
	private Credentials credentials;
	protected static Storage storage;
	protected final Bucket bucket;

	static {
		try {
			// we move to ByteArrayInputStream because appengine credentials are not enough
			byte[] ba =("{\n" +
					"  \"type\": \"service_account\",\n" +
					"  \"project_id\": \"drive-cloud-on-gcp\",\n" +
					"  \"private_key_id\": \"XXXX\",\n" +
					"  \"private_key\": \"-----BEGIN PRIVATE KEY-----\\XXX=\\n-----END PRIVATE KEY-----\\n\",\n" +
					"  \"client_email\": \"provacloud@drive-cloud-on-gcp.iam.gserviceaccount.com\",\n" +
					"  \"client_id\": \"XXX\",\n" +
					"  \"auth_uri\": \"https://accounts.google.com/o/oauth2/auth\",\n" +
					"  \"token_uri\": \"https://oauth2.googleapis.com/token\",\n" +
					"  \"auth_provider_x509_cert_url\": \"https://www.googleapis.com/oauth2/v1/certs\",\n" +
					"  \"client_x509_cert_url\": \"https://www.googleapis.com/robot/v1/metadata/x509/provacloud%40drive-cloud-on-gcp.iam.gserviceaccount.com\"\n" +
					"}\n").getBytes();
			ByteArrayInputStream bais = new ByteArrayInputStream(ba);
			storage =
					StorageOptions.newBuilder()
							.setCredentials(ServiceAccountCredentials.fromStream(bais))
							/// .setCredentials(ServiceAccountCredentials.getApplicationDefault())
							.setProjectId(PROJECT_ID)
							.build()
							.getService();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	FileController() {

		bucket = storage.get(BUCKET_NAME);
	}

	boolean exists(String prefix) {
		Page<Blob> list = bucket.list(Storage.BlobListOption.prefix(prefix));
		return list.iterateAll().iterator().hasNext();
	}

	void cleanLandingPage(String prefix){
		Page<Blob> list = bucket.list(Storage.BlobListOption.prefix(prefix));
		for (Blob b : list.iterateAll()) {
			storage.delete(b.getBlobId());
		}
	}


	File convertMultiPartToFile(MultipartFile file) throws IOException {
		String fileName = file.getOriginalFilename();
		if (fileName == null) {
			return null;
		}
		File convFile = new File(fileName);
		try {
			FileOutputStream fos = new FileOutputStream(convFile);
			fos.write(file.getBytes());
			fos.close();
		} catch (Exception e) {
			return null;
		}
		return convFile;
	}


	public static File convert(MultipartFile file) throws IOException { // convert multipart to file.
		File convFile = new File(file.getOriginalFilename());
		convFile.createNewFile();
		try (InputStream is = file.getInputStream()) {
			Files.copy(is, convFile.toPath());
		}
		return convFile;
	}
}