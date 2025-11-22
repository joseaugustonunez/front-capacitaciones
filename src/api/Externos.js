import axios from "axios";

export const obtenerVideosExternos = async () => {
  const { data } = await axios.get("http://monitoreo.regionhuanuco.gob.pe/api/public/v1/origen-videos");
  return data;
};
export const obtenerVideoExternoPorUUID = async (uuid) => {
  const { data } = await axios.get(`http://monitoreo.regionhuanuco.gob.pe/api/public/v1/origen-videos/${uuid}`);
  return data;
};