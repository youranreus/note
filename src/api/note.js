import qs from "qs";
import { API } from ".";

export const GetNote = (id, key) =>
	API.get("/get/" + id + (key ? "?key=" + key : ""));

export const DeleteNote = (id, key) => API.get(`/delete/${id}?key=${key}`);

export const ModifyNote = (id, key, data) =>
	API.post(`/modify/${id}?key=${key}`, qs.stringify(data));
