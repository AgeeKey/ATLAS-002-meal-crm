import sys
from datetime import date
from sqlmodel import Session, select, delete
from app.core.db import engine
from app.models import User, Client, Package, Payment, Freeze, Delivery, Extension, Note
from app.models import ClientStatus, PackageStatus, PackageMealType

def reset_and_seed():
    with Session(engine) as session:
        print('Fetching users...')
        admin_user = session.exec(select(User).where(User.email == 'admin@example.com')).first()
        users = session.exec(select(User)).all()
        for u in users:
            if u.email != 'admin@example.com':
                session.delete(u)
        
        print('Deleting existing CRM data...')
        session.exec(delete(Payment))
        session.exec(delete(Freeze))
        session.exec(delete(Delivery))
        session.exec(delete(Extension))
        session.exec(delete(Note))
        session.exec(delete(Package))
        session.exec(delete(Client))
        
        session.commit()
        
        print('Creating Client 1: 3X package...')
        client1 = Client(name='Азамат Усенов', phone='+996 555 123 456', address='пр. Чуй 123, кв 45', status=ClientStatus.ACTIVE)
        session.add(client1)
        session.commit()
        session.refresh(client1)
        
        pkg1 = Package(client_id=client1.id, meal_type=PackageMealType.THREE_X, price=15000, paid_amount=15000, start_date=date(2026, 8, 1), end_date=date(2026, 8, 20), total_days=20, status=PackageStatus.ACTIVE)
        session.add(pkg1)
        session.commit()
        session.refresh(pkg1)
        
        session.add(Payment(package_id=pkg1.id, amount=15000, date=date(2026, 8, 1), comment='Наличными курьеру'))
        session.add(Delivery(package_id=pkg1.id, scheduled_date=date(2026, 8, 1), sent_date=date(2026, 8, 1)))
        session.add(Delivery(package_id=pkg1.id, scheduled_date=date(2026, 8, 2), sent_date=date(2026, 8, 2)))
        session.add(Delivery(package_id=pkg1.id, scheduled_date=date(2026, 8, 3), sent_date=date(2026, 8, 3)))
        session.add(Delivery(package_id=pkg1.id, scheduled_date=date(2026, 8, 4), sent_date=None))
        
        print('Creating Client 2: 5X package (with debt)...')
        client2 = Client(name='Айнура Бекова', phone='+996 700 987 654', address='ул. Токтогула 45', status=ClientStatus.DEBT)
        session.add(client2)
        session.commit()
        session.refresh(client2)
        
        pkg2 = Package(client_id=client2.id, meal_type=PackageMealType.FIVE_X, price=20000, paid_amount=10000, start_date=date(2026, 8, 10), end_date=date(2026, 9, 8), total_days=30, status=PackageStatus.ACTIVE)
        session.add(pkg2)
        session.commit()
        session.refresh(pkg2)
        
        session.add(Payment(package_id=pkg2.id, amount=10000, date=date(2026, 8, 10), comment='Банковский перевод'))
        session.add(Delivery(package_id=pkg2.id, scheduled_date=date(2026, 8, 10), sent_date=date(2026, 8, 10)))
        
        print('Creating Client 3: 3X and 5X packages...')
        client3 = Client(name='Тимур Сатылганов', phone='+996 777 111 222', address='мкр. Асанбай 12, кв 1', status=ClientStatus.ACTIVE)
        session.add(client3)
        session.commit()
        session.refresh(client3)
        
        pkg3_1 = Package(client_id=client3.id, meal_type=PackageMealType.THREE_X, price=15000, paid_amount=15000, start_date=date(2026, 7, 1), end_date=date(2026, 7, 20), total_days=20, status=PackageStatus.COMPLETED)
        session.add(pkg3_1)
        session.commit()
        session.refresh(pkg3_1)
        
        session.add(Payment(package_id=pkg3_1.id, amount=15000, date=date(2026, 7, 1), comment='Терминал'))
        
        pkg3_2 = Package(client_id=client3.id, meal_type=PackageMealType.FIVE_X, price=20000, paid_amount=20000, start_date=date(2026, 8, 15), end_date=date(2026, 9, 13), total_days=30, status=PackageStatus.ACTIVE)
        session.add(pkg3_2)
        session.commit()
        session.refresh(pkg3_2)
        
        session.add(Payment(package_id=pkg3_2.id, amount=20000, date=date(2026, 8, 15), comment='Оплата картой на сайте'))
        session.add(Freeze(package_id=pkg3_2.id, start_date=date(2026, 8, 20), end_date=date(2026, 8, 22), reason='Командировка'))
        session.add(Extension(package_id=pkg3_2.id, extra_days=2, added_price=0, date=date(2026, 8, 16), reason='Бонус за лояльность'))
        
        session.commit()
        print('Data seeded successfully! There are exactly 3 clients now, and 1 admin.')

if __name__ == '__main__':
    reset_and_seed()
