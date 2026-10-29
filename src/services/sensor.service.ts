import { SensorModel } from "../models/sensor.model.js";
import { LecturaModel } from "../models/lectura.model.js";
import { SensorNotFoundError, SensorInUseError } from "../errors/resource.errors.js";
import { SensorInput, UpdateSensorInput } from "../schemas/sensor.schema.js";


export class SensorService {

    async getAllSensors() {
        return SensorModel.find().exec();
    }

    async getSensorById(id: string) {
        const sensor = await SensorModel.findById(id).exec();
        if (!sensor) {
            throw new SensorNotFoundError(id);
        }
        return sensor;
    }

    //admin, se limita en ruta
    async createSensor(data: SensorInput) {
        const sensor = new SensorModel(data);
        return await sensor.save();
    }

    async updateSensor(id: string, data: UpdateSensorInput) {
        const sensor = await SensorModel.findByIdAndUpdate(id, data, { 
            new: true, 
            runValidators: true 
        }).exec();
        
        if (!sensor) {
            throw new SensorNotFoundError(id);
        }
        return sensor;
    }

    async deleteSensor(id: string) {
        const sensor = await SensorModel.findById(id).exec();
        if (!sensor) {
            throw new SensorNotFoundError(id);
        }

        const lecturas = await LecturaModel.countDocuments({ sensorId: id });
        if (lecturas > 0) {
            throw new SensorInUseError(id);
        }

        await sensor.deleteOne();
        return sensor;
    }
}

export const sensorService = new SensorService();