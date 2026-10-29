import { LecturaModel } from "../models/lectura.model.js";
import { SensorModel } from "../models/sensor.model.js";
import { SensorNotFoundError, InactiveSensorError } from "../errors/resource.errors.js";
import { CreateLecturaInput, GetLecturasQueryInput } from "../schemas/lectura.schema.js";

export class LecturaService {

    
    async createLectura(data: CreateLecturaInput) {
        const sensor = await SensorModel.findById(data.sensorId).exec();
        if (!sensor) {
            throw new SensorNotFoundError(data.sensorId);
        }

        if (!sensor.activo) {
            throw new InactiveSensorError(data.sensorId);
        }

        const esAnomala = data.valor > sensor.valorLimite;

        // Crear y guardar la lectura
        const lectura = new LecturaModel({
            sensorId: data.sensorId,
            valor: data.valor,
            unidad: data.unidad,
            esAnomala,
            tiempo: data.tiempo || new Date(),
        });

        return await lectura.save();
    }

    
    async getLecturas(query: GetLecturasQueryInput) {
        const { pagina = 1, limite = 20, sensorId, tipo, anomala, orden = "-tiempo" } = query;
        const filtro: any = {};

        if (tipo) {
            const sensoresDeTipo = await SensorModel.find({ tipo }).distinct("_id");
            
            if (sensorId) {
                const perteneceATipo = sensoresDeTipo.some(id => id.toString() === sensorId);
                if (!perteneceATipo) {
                    return {
                        data: [],
                        meta: { page: pagina, limit: limite, total: 0, totalPages: 0 }
                    };
                }
                filtro.sensorId = sensorId;
            } else {
                filtro.sensorId = { $in: sensoresDeTipo };
            }
        } else if (sensorId) {
            filtro.sensorId = sensorId;
        }

        if (anomala !== undefined) {
            filtro.esAnomala = anomala;
        }

        const skip = (pagina - 1) * limite;

        const [lecturas, total] = await Promise.all([
            LecturaModel.find(filtro)
                .sort(orden)
                .skip(skip)
                .limit(limite)
                .exec(),
            LecturaModel.countDocuments(filtro).exec(),
        ]);

        const totalPages = Math.ceil(total / limite);

        return {
            data: lecturas,
            meta: {
                page: pagina,
                limit: limite,
                total,
                totalPages: totalPages > 0 ? totalPages : 0,
            },
        };
    }
}

export const lecturaService = new LecturaService();