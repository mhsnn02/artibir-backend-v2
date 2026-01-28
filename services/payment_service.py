import iyzipay
import os
from dotenv import load_dotenv
from uuid import uuid4

load_dotenv()

class PaymentService:
    @staticmethod
    def _get_options():
        options = {
            'api_key': os.getenv("IYZICO_API_KEY"),
            'secret_key': os.getenv("IYZICO_SECRET_KEY"),
            'base_url': os.getenv("IYZICO_BASE_URL")
        }
        return options

    @staticmethod
    def initialize_3ds_payment(user, card_info, amount, conversation_id=None):
        """
        Iyzico 3D Secure ödeme başlatır.
        """
        if conversation_id is None:
            conversation_id = str(uuid4())

        # Adres Bilgileri (Mock - Gerçekte kullanıcıdan alınmalı)
        address = {
            'contactName': user.full_name,
            'city': user.city or 'Istanbul',
            'country': 'Turkey',
            'address': 'Kadikoy - Istanbul',
            'zipCode': '34744'
        }

        request = {
            'locale': 'tr',
            'conversationId': conversation_id,
            'price': str(amount),
            'paidPrice': str(amount),
            'currency': 'TRY',
            'basketId': 'B' + str(uuid4())[:8],
            'paymentGroup': 'PRODUCT',
            'callbackUrl': os.getenv("APP_URL", "http://localhost:8000") + "/payments/callback", # Dinamik Callback URL
            'paymentCard': {
                'cardHolderName': card_info['card_holder_name'],
                'cardNumber': card_info['card_number'],
                'expireMonth': card_info['expire_month'],
                'expireYear': card_info['expire_year'],
                'cvc': card_info['cvc'],
                'registerCard': '1' if card_info.get('register_card') else '0'
            },
            'buyer': {
                'id': str(user.id),
                'name': user.full_name.split()[0] if " " in user.full_name else user.full_name,
                'surname': user.full_name.split()[-1] if " " in user.full_name else 'ArtibirUser',
                'gsmNumber': user.phone_number or '+905555555555',
                'email': user.email,
                'identityNumber': user.tc_no or '11111111111',
                'lastLoginDate': '2023-10-05 12:43:35',
                'registrationDate': '2023-09-05 10:11:00',
                'registrationAddress': address['address'],
                'ip': '85.34.78.112',
                'city': address['city'],
                'country': address['country'],
                'zipCode': address['zipCode']
            },
            'shippingAddress': address,
            'billingAddress': address,
            'basketItems': [
                {
                    'id': 'BI101',
                    'name': 'Artibir Wallet Top-up',
                    'category1': 'Wallet',
                    'itemType': 'VIRTUAL',
                    'price': str(amount)
                }
            ]
        }

        threeds_initialize = iyzipay.ThreedsInitialize().create(request, PaymentService._get_options())
        return threeds_initialize.read().decode('utf-8')

    @staticmethod
    def retrieve_3ds_result(payment_id, conversation_id):
        """
        3D Secure sonucunu Iyzico'dan çeker.
        """
        request = {
            'locale': 'tr',
            'conversationId': conversation_id,
            'paymentId': payment_id
        }

        threeds_payment = iyzipay.ThreedsPayment().create(request, PaymentService._get_options())
        return threeds_payment.read().decode('utf-8')

    @staticmethod
    def register_card(user, card_info):
        """
        Kartı Iyzico tarafında güvenli bir şekilde saklar.
        """
        request = {
            'locale': 'tr',
            'conversationId': str(uuid4()),
            'email': user.email,
            'externalId': str(user.id),
            'card': {
                'cardHolderName': card_info['card_holder_name'],
                'cardNumber': card_info['card_number'],
                'expireMonth': card_info['expire_month'],
                'expireYear': card_info['expire_year'],
            }
        }

        card_storage = iyzipay.Card().create(request, PaymentService._get_options())
        return card_storage.read().decode('utf-8')
