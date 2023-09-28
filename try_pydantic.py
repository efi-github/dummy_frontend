from typing import Literal, Union

from pydantic import BaseModel, Field, ValidationError
from typing import Literal, Union

from typing_extensions import Annotated

from pydantic import BaseModel, Field, ValidationError

class Cat(BaseModel):
    pet_type: Literal['cat']
    meows: int


class Dog(BaseModel):
    pet_type: Literal['dog']
    barks: float


class Lizard(BaseModel):
    pet_type: Literal['reptile', 'lizard']
    scales: bool = True


class Model(BaseModel):
    pet: Union[Cat, Dog, Lizard] = Field(Lizard, discriminator='pet_type')
    n: int =1


print(Model(pet={'pet_type': 'dog', 'barks': 3.14}, n=1))
#> pet=Dog(pet_type='dog', barks=3.14) n=1
a = None
try:
    a = Model(pet={'pet_type': 'dog'}, n=1)
except ValidationError as e:
    print(e)



print("-"*50)
try:
    a = Model()
except ValidationError as e:
    print(e)
print(a.json())