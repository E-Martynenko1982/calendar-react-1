import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createEvent } from '../../gateway/events';
import './modal.scss';

const Modal = ({ closeModal, selectedTimeSlot, events, loadEvents }) => {
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  const roundToNearest15 = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Invalid date passed to roundToNearest15');
      return new Date();
    }

    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
    const adjustedHours = roundedMinutes === 60 ? date.getHours() + 1 : date.getHours();

    return new Date(date.setHours(adjustedHours, finalMinutes, 0));
  };

  useEffect(() => {
    if (selectedTimeSlot && !isNaN(new Date(selectedTimeSlot).getTime())) {
      const startTime = roundToNearest15(new Date(selectedTimeSlot));
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      setEventData((prevData) => ({
        ...prevData,
        date: startTime.toISOString().split('T')[0],
        startTime: startTime.toTimeString().slice(0, 5),
        endTime: endTime.toTimeString().slice(0, 5),
      }));
    } else {
      const now = new Date();
      const startTime = roundToNearest15(now);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      setEventData((prevData) => ({
        ...prevData,
        date: startTime.toISOString().split('T')[0],
        startTime: startTime.toTimeString().slice(0, 5),
        endTime: endTime.toTimeString().slice(0, 5),
      }));
    }
  }, [selectedTimeSlot]);

  const validateEvent = (eventStart, eventEnd, events) => {
    const sixHoursInMillis = 6 * 60 * 60 * 1000;

    if (eventEnd.getTime() - eventStart.getTime() > sixHoursInMillis) {
      alert('Событие не может длиться дольше 6 часов.');
      return false;
    }

    if (eventStart.toDateString() !== eventEnd.toDateString()) {
      alert('Событие должно начаться и закончиться в пределах одного дня.');
      return false;
    }

    const isOverlapping = events.some(
      (event) => eventStart < event.dateTo && eventEnd > event.dateFrom
    );

    if (isOverlapping) {
      alert('События не могут пересекаться по времени.');
      return false;
    }

    return true;
  };

  const handleTimeChange = (event) => {
    const { name, value } = event.target;
    const [hours, minutes] = value.split(':').map(Number);
    const newTime = new Date();
    newTime.setHours(hours, minutes);

    const roundedTime = roundToNearest15(newTime);

    setEventData((prevEventData) => ({
      ...prevEventData,
      [name]: roundedTime.toTimeString().slice(0, 5),
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setEventData((prevEventData) => ({
      ...prevEventData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const eventStart = new Date(`${eventData.date}T${eventData.startTime}`);
    const eventEnd = new Date(`${eventData.date}T${eventData.endTime}`);

    if (validateEvent(eventStart, eventEnd, events)) {
      const newEvent = {
        title: eventData.title,
        dateFrom: eventStart,
        dateTo: eventEnd,
        description: eventData.description,
      };

      createEvent(newEvent)
        .then(() => {
          closeModal();
          loadEvents();
        })
        .catch((error) => {
          console.error(error.message);
        });
    }
  };

  return (
    <div className="modal overlay">
      <div className="modal__content">
        <div className="create-event">
          <button className="create-event__close-btn" onClick={closeModal}>
            +
          </button>
          <form className="event-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="title"
              placeholder="Title"
              className="event-form__field-title"
              value={eventData.title}
              onChange={handleChange}
              required
            />
            <div className="event-form__time">
              <input
                type="date"
                name="date"
                className="event-form__field"
                value={eventData.date}
                onChange={handleChange}
                required
              />
              <input
                type="time"
                name="startTime"
                className="event-form__field"
                value={eventData.startTime}
                onChange={handleTimeChange}
                required
              />
              <span>-</span>
              <input
                type="time"
                name="endTime"
                className="event-form__field"
                value={eventData.endTime}
                onChange={handleTimeChange}
                required
              />
            </div>
            <textarea
              name="description"
              placeholder="Description"
              className="event-form__field"
              value={eventData.description}
              onChange={handleChange}
            ></textarea>
            <button type="submit" className="event-form__submit-btn">
              Create
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  selectedTimeSlot: PropTypes.instanceOf(Date),
  events: PropTypes.array.isRequired,
  loadEvents: PropTypes.func.isRequired,
};

Modal.defaultProps = {
  selectedTimeSlot: null,
};

export default Modal;
