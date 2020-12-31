package com.example.cloud_computing;


import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.UUID;
import java.util.regex.Pattern;

public interface Utilities {

	static final String emailRegex = "^(.+)@(.+)$";
	static final Pattern emailPattern = Pattern.compile(emailRegex);

	public static String removeSuffix(final String s, final String suffix) {
		if (s != null && suffix != null && s.endsWith(suffix)) {
			return s.substring(0, s.length() - suffix.length());
		}
		return s;
	}


	public static String mkdirTMP() {
		final String postfix = UUID.randomUUID().toString() + "/";
		final String path = "/tmp/" + postfix;
		File file = new File(path);
		boolean boolMkdir = file.mkdir();
		if (boolMkdir) {
			System.out.println("Directory created successfully");
		} else {
			System.out.println("Sorry couldn’t create the specified directory");
		}
		return postfix;
	}

	static boolean isDir(String path) {
		return path.endsWith("/");
	}

	static String getTimeStamp() {
		final String pattern = "dd/MM/yyyy HH:mm";
		final SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern);
		return simpleDateFormat.format(new Date());
	}

	static String getTimeStampZip() {
		final String patternDate = "yyyyMMdd";
		final String patternTime = "HHmmss";
		final SimpleDateFormat simpleDateFormat = new SimpleDateFormat(patternDate);
		final SimpleDateFormat simpleTimeFormat = new SimpleDateFormat(patternTime);
		return simpleDateFormat.format(new Date()) + simpleTimeFormat.format(new Date());
	}

	static HashMap<String, String> createStatus(String error, String details) {
		HashMap<String, String> result = new HashMap<>();
		result.put("status", error);
		result.put("details", details);
		return result;
	}

	static HashMap<String, String> sendError(String details) {
		HashMap<String, String> result = new HashMap<>();
		result.put("status", "1");
		result.put("details", details);
		return result;
	}

	static HashMap<String, String> sendTokenInvalid() {
		HashMap<String, String> result = new HashMap<>();
		result.put("status", "2");
		result.put("details", "invalid token");
		return result;
	}

	static HashMap<String, String> sendSuccess() {
		HashMap<String, String> result = new HashMap<>();
		result.put("status", "0");
		result.put("details", "");
		return result;
	}
}
