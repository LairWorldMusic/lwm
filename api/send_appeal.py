# -*- coding: utf8 -*-
"""
Скрипт для отправки обращений в Telegram бот всем пользователям с rukwo = 'yes'
Использование: python send_appeal.py "Имя" "Контакты" "Текст сообщения"
"""

import sys
import requests
import sqlite3
import os
from datetime import datetime, timedelta

# Конфигурация Telegram
TELEGRAM_BOT_TOKEN = '5651525987:AAHHAY-mXh69GP7vjZDln98hn5E60K5lj8U'
MAIN_GROUP_ID = -1001736659343  # Основная группа

def get_project_root():
    """Определяет корень проекта (на три уровня выше от site/api/)"""
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def get_rukwo_users():
    """Получить список всех пользователей с rukwo = 'yes'"""
    try:
        # Путь к базе данных (относительно корня проекта)
        project_root = get_project_root()
        db_path = os.path.join(project_root, 'database', 'users.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM users WHERE rukwo = 'yes'")
        users = cursor.fetchall()
        conn.close()
        return [user[0] for user in users]  # Возвращаем список user_id
    except Exception as e:
        print(f"ERROR: Ошибка получения списка пользователей: {str(e)}")
        return []

def create_invite_link():
    """Создание одноразовой ссылки-приглашения в группу"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/createChatInviteLink"
        data = {
            'chat_id': str(MAIN_GROUP_ID),
            'name': 'Заявка на вступление',
            'member_limit': 1
        }
        response = requests.post(url, data=data, timeout=10)
        response.raise_for_status()
        result = response.json()
        if result.get('ok'):
            return result['result']['invite_link']
        return None
    except Exception as e:
        print(f"ERROR: Ошибка создания ссылки-приглашения: {str(e)}")
        return None

def get_user_id_by_username(username):
    """Получение user_id по username через Telegram API"""
    try:
        # Убираем @ если есть
        username = username.lstrip('@')
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getChat"
        data = {'chat_id': f'@{username}'}
        response = requests.post(url, data=data, timeout=10)
        response.raise_for_status()
        result = response.json()
        if result.get('ok'):
            return result['result'].get('id')
        return None
    except Exception as e:
        print(f"ERROR: Ошибка получения user_id для @{username}: {str(e)}")
        return None

def send_appeal(name, contact, text):
    """Отправка обращения всем пользователям с rukwo = 'yes' и отправка ссылки-приглашения заявителю"""
    try:
        # Получаем список пользователей с rukwo = 'yes'
        rukwo_users = get_rukwo_users()
        
        if not rukwo_users:
            print("ERROR: Не найдено пользователей с rukwo = 'yes'")
            return False
        
        # Формируем сообщение
        message = f"<b>Новое обращение!</b>\n\n"
        message += f"<b>Имя:</b> {name}\n"
        message += f"<b>Контакты:</b> {contact}\n"
        message += f"<b>Текст:</b> {text}"
        
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        
        success_count = 0
        error_count = 0
        
        # Отправляем сообщение каждому пользователю
        for user_id in rukwo_users:
            try:
                data = {
                    'chat_id': str(user_id),
                    'text': message,
                    'parse_mode': 'HTML'
                }
                
                response = requests.post(url, data=data, timeout=10)
                response.raise_for_status()
                
                result = response.json()
                if result.get('ok'):
                    success_count += 1
                else:
                    error_count += 1
                    print(f"ERROR: {result.get('description', 'Unknown error')} для user_id {user_id}")
            except Exception as e:
                error_count += 1
                print(f"ERROR: Ошибка отправки user_id {user_id}: {str(e)}")
        
        # Создаем ссылку-приглашение и отправляем заявителю
        invite_link = create_invite_link()
        if invite_link and contact.startswith('@'):
            user_id = get_user_id_by_username(contact)
            if user_id:
                invite_message = (
                    f"✅ <b>Спасибо за вашу заявку!</b>\n\n"
                    f"Ваше обращение получено и будет рассмотрено.\n\n"
                    f"📋 <b>Для продолжения работы с ботом необходимо вступить в группу:</b>\n\n"
                    f"Нажмите на ссылку, чтобы присоединиться:\n"
                    f"{invite_link}\n\n"
                    f"⚠️ <b>Важно:</b> Без вступления в группу вы не сможете пользоваться ботом."
                )
                try:
                    data = {
                        'chat_id': str(user_id),
                        'text': invite_message,
                        'parse_mode': 'HTML'
                    }
                    response = requests.post(url, data=data, timeout=10)
                    response.raise_for_status()
                    print(f"OK: Ссылка-приглашение отправлена пользователю {contact}")
                except Exception as e:
                    print(f"ERROR: Ошибка отправки ссылки пользователю {contact}: {str(e)}")
            else:
                print(f"ERROR: Не удалось получить user_id для {contact}")
        elif invite_link:
            print(f"WARNING: Контакт {contact} не является Telegram username, ссылка не отправлена")
        
        if success_count > 0:
            print(f"OK: Отправлено {success_count} сообщений, ошибок: {error_count}")
            return True
        else:
            print(f"ERROR: Не удалось отправить ни одно сообщение")
            return False
            
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("ERROR: Неверное количество аргументов")
        print("Использование: python send_appeal.py \"Имя\" \"Контакты\" \"Текст\"")
        sys.exit(1)
    
    name = sys.argv[1]
    contact = sys.argv[2]
    text = sys.argv[3]
    
    success = send_appeal(name, contact, text)
    sys.exit(0 if success else 1)

